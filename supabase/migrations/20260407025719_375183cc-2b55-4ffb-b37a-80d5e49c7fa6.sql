DELETE FROM public.custom_services
WHERE lower(name) = 'crunchyroll'
  AND id NOT IN (
    SELECT (MIN(id::text))::uuid FROM public.custom_services WHERE lower(name) = 'crunchyroll' GROUP BY user_id
  );