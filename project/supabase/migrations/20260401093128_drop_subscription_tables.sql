/*
  # Remove subscription tables

  1. Changes
    - Drop subscriptions table
    - Drop user_subscriptions table
    - Remove all subscription-related migrations
    - Clean up unused subscription functionality
*/

DROP TABLE IF EXISTS public.user_subscriptions CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
