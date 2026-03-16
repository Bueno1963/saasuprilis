
-- Fix MaxBIO200B: set correct type/protocol (id: b22092f2)
UPDATE public.integrations SET type = 'HL7', protocol = 'TCP' WHERE id = 'b22092f2-aef0-4111-aa00-a64efa50ef43' AND name = 'MaxBIO200B';

-- Fix MAXCELL500 D: set correct type/protocol (id: 9ab29527)
UPDATE public.integrations SET type = 'HL7', protocol = 'MLLP' WHERE id = '9ab29527-8851-4a93-9d23-ad4eb7ec0812' AND name = 'MAXCELL500 D';
