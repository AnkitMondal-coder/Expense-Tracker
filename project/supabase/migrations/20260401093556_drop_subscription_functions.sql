/*
  # Remove subscription trigger functions

  1. Changes
    - Drop function create_subscription_for_new_user
    - Drop function create_basic_subscription_for_new_user
    - These were trying to create subscription records on user signup
    - Now that subscriptions are removed, these functions are no longer needed
*/

DROP FUNCTION IF EXISTS public.create_subscription_for_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_basic_subscription_for_new_user() CASCADE;
