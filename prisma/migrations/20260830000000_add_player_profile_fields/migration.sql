ALTER TABLE "Player" ADD COLUMN "preferredFoot" TEXT;
ALTER TABLE "Player" ADD COLUMN "abilities" TEXT;

UPDATE "Setting"
SET "value" = jsonb_set("value", '{registrationKobo}', '19000000'::jsonb)
WHERE "key" = 'fees'
  AND ("value"->>'registrationKobo')::bigint = 15000000;

UPDATE "Coach"
SET "name" = 'Coach Olumuyiwa'
WHERE "role" = 'Head Coach' AND "name" = 'Coach Moyiwa';
