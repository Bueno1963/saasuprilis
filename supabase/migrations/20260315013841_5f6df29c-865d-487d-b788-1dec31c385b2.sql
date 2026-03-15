
DELETE FROM public.portal_access_logs WHERE order_id IN (
  'eabeb8b2-3bbb-46e3-9009-8fe701354127',
  '7ef6fef6-248a-441e-8fae-ca8d14831392',
  '49f748a1-cac9-43e2-9df3-ea3fc2ed7f2a',
  'f28856b4-f820-44aa-a1f5-694b6387f952',
  '306d6a38-ae5e-4520-93d9-77a75f4330b8',
  '6e2b17fe-b7cc-4585-a053-e202fe7e4922'
);

DELETE FROM public.samples WHERE order_id IN (
  'eabeb8b2-3bbb-46e3-9009-8fe701354127',
  '7ef6fef6-248a-441e-8fae-ca8d14831392',
  '49f748a1-cac9-43e2-9df3-ea3fc2ed7f2a',
  'f28856b4-f820-44aa-a1f5-694b6387f952',
  '306d6a38-ae5e-4520-93d9-77a75f4330b8',
  '6e2b17fe-b7cc-4585-a053-e202fe7e4922'
);

DELETE FROM public.orders WHERE id IN (
  'eabeb8b2-3bbb-46e3-9009-8fe701354127',
  '7ef6fef6-248a-441e-8fae-ca8d14831392',
  '49f748a1-cac9-43e2-9df3-ea3fc2ed7f2a',
  'f28856b4-f820-44aa-a1f5-694b6387f952',
  '306d6a38-ae5e-4520-93d9-77a75f4330b8',
  '6e2b17fe-b7cc-4585-a053-e202fe7e4922'
);
