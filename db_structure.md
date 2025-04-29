# Database Schema

This document outlines the structure of the PostgreSQL database managed by Supabase.

## Tables

### `customers`

Stores customer information, including details needed for orders and potentially linking to Stripe customers.

-   `id` (uuid, PK): Unique identifier for the customer.
-   `email` (varchar(255), Not Null): Customer's email address.
-   `name` (varchar(255), Not Null): Customer's full name.
-   `phone` (varchar(50), Not Null): Customer's phone number.
-   `address_line1` (varchar(255), Not Null): Billing/Shipping address line 1.
-   `address_line2` (varchar(255)): Billing/Shipping address line 2.
-   `city` (varchar(100), Not Null): City.
-   `state` (varchar(100), Not Null): State/Province/Region.
-   `postal_code` (varchar(20), Not Null): Postal/ZIP code.
-   `country` (varchar(100), Not Null): Country.
-   `shirt_size` (varchar(10), Not Null): Primary customer's shirt size.
-   `height` (varchar(20)): Primary customer's height.
-   `weight` (integer): Primary customer's weight.
-   `spouse_name` (varchar(255)): Spouse's name (optional).
-   `spouse_shirt_size` (varchar(10)): Spouse's shirt size (optional).
-   `spouse_height` (varchar(20)): Spouse's height (optional).
-   `spouse_weight` (integer): Spouse's weight (optional).
-   `additional_guest_name` (varchar(255)): Additional guest's name (optional).
-   `additional_guest_shirt_size` (varchar(10)): Additional guest's shirt size (optional).
-   `special_requirements` (text): Any special requirements.
-   `stripe_customer_id` (text, Unique): Stripe Customer ID (optional).
-   `created_at` (timestamptz, Default: now()): Timestamp of creation.
-   `updated_at` (timestamptz, Default: now()): Timestamp of last update.

### `orders`

Stores information about each order placed.

-   `id` (uuid, PK): Unique identifier for the order.
-   `customer_id` (uuid, Not Null, FK -> customers.id): Reference to the customer who placed the order.
-   `amount` (integer): Total order amount in cents.
-   `currency` (varchar(3)): Currency code (e.g., 'usd').
-   `stripe_payment_intent_id` (text, Unique): Stripe Payment Intent ID associated with the order.
-   `status` (varchar(50), Not Null, Default: 'pending'): Order status (e.g., 'pending', 'succeeded', 'failed').
-   `metadata` (jsonb): Any additional metadata associated with the order (optional).
-   `created_at` (timestamptz, Default: now()): Timestamp of creation.
-   `updated_at` (timestamptz, Default: now()): Timestamp of last update.

### `activities`

Stores details about purchasable activities.

-   `id` (uuid, PK): Unique identifier for the activity.
-   `name` (text, Not Null): Name of the activity.
-   `description` (text): Description of the activity.
-   `price_cents` (integer, Not Null, Check >= 0): Price per unit (e.g., per person) in cents.
-   `image_url` (text): URL for an image representing the activity.
-   `active` (boolean, Default: true): Whether the activity is currently available for purchase.
-   `stripe_price_id` (text, Unique): Optional Stripe Price ID for this activity.
-   `created_at` (timestamptz, Default: now()): Timestamp of creation.
-   `updated_at` (timestamptz, Default: now()): Timestamp of last update.

### `accommodations`

Stores details about purchasable accommodation options.

-   `id` (uuid, PK): Unique identifier for the accommodation type.
-   `name` (text, Not Null): Name of the accommodation (e.g., 'Standard Room', 'Suite').
-   `description` (text): Description of the accommodation.
-   `price_per_night_cents` (integer, Not Null, Check >= 0): Price per night in cents.
-   `active` (boolean, Default: true): Whether this accommodation is available.
-   `stripe_price_id` (text, Unique): Optional Stripe Price ID for this accommodation.
-   `created_at` (timestamptz, Default: now()): Timestamp of creation.
-   `updated_at` (timestamptz, Default: now()): Timestamp of last update.

### `sponsorships`

Stores details for different sponsorship tiers.

-   `id` (uuid, PK): Unique identifier for the sponsorship tier.
-   `name` (text, Not Null): Name of the sponsorship level (e.g., 'Gold Sponsor').
-   `description` (text): Description of the sponsorship benefits.
-   `level` (integer): Numerical or categorical level of sponsorship.
-   `price_cents` (integer, Not Null, Check >= 0): Price of the sponsorship tier in cents.
-   `stripe_price_id` (text, Unique): Optional Stripe Price ID for this sponsorship tier.
-   `benefits` (jsonb): JSON representation of the benefits included.
-   `active` (boolean, Default: true, Not Null): Whether this tier is available.
-   `created_at` (timestamptz, Default: now(), Not Null): Timestamp of creation.
-   `updated_at` (timestamptz, Default: now(), Not Null): Timestamp of last update.

### `order_items`

Consolidated table linking products (activities, accommodations, sponsorships) to orders.

-   `id` (uuid, PK): Unique identifier for the order item line.
-   `order_id` (uuid, Not Null, FK -> orders.id): Reference to the order this item belongs to.
-   `product_id` (uuid, Not Null): FK referencing the ID in the corresponding product table (`activities`, `accommodations`, `sponsorships`).
-   `product_type` (text, Not Null, Check IN ('activity', 'accommodation', 'sponsorship')): Indicates which table `product_id` refers to.
-   `quantity` (integer, Not Null, Default: 1, Check > 0): Quantity of the product purchased.
-   `unit_price_cents` (integer, Not Null, Check >= 0): Price per unit in cents at the time of purchase.
-   `line_item_total_cents` (integer, Not Null, Check >= 0): Total price for this line item (`quantity` * `unit_price_cents`) in cents.
-   `product_name` (text, Not Null): Name of the product at the time of purchase.
-   `metadata` (jsonb): Stores item-specific details (e.g., participant type for activities, guest names, selected options).
-   `created_at` (timestamptz, Default: now(), Not Null): Timestamp of creation.
-   `updated_at` (timestamptz, Default: now(), Not Null): Timestamp of last update.

### `hotel_bookings`

Stores specific details for hotel accommodation booked as part of an order, linked via `order_items`.

-   `id` (uuid, PK): Unique identifier for the booking record.
-   `order_item_id` (uuid, FK -> order_items.id): References the specific order item this booking corresponds to.
-   `order_id` (uuid): DEPRECATED FK -> orders.id. Kept for potential historical data reference.
-   `check_in_date` (date, Not Null): Check-in date.
-   `check_out_date` (date, Not Null): Check-out date.
-   `guests` (integer, Not Null): Number of guests for this booking.
-   `nights` (integer, Not Null): Number of nights booked.
-   `price_per_night_cents` (integer, Not Null): Price per night for the room in cents (at time of booking).
-   `total_price_cents` (integer, Not Null): Total price for the entire hotel stay in cents (at time of booking).
-   `created_at` (timestamptz, Default: now(), Not Null): Timestamp of creation.
-   `updated_at` (timestamptz, Default: now(), Not Null): Timestamp of last update.

## Relationships

-   `orders.customer_id` -> `customers.id` (One-to-Many: Customer can have multiple Orders)
-   `order_items.order_id` -> `orders.id` (One-to-Many: Order can have multiple Order Items)
-   `hotel_bookings.order_item_id` -> `order_items.id` (One-to-One: An accommodation Order Item corresponds to one Hotel Booking)
-   `order_items.product_id` references `id` in `activities`, `accommodations`, or `sponsorships` based on `product_type`. (Polymorphic-like relationship managed by application logic/webhook).

## Triggers

-   `handle_updated_at()` trigger function updates the `updated_at` column on relevant tables before any update operation.