-- Migration: Adiciona campos de runtime para WSS e TURN em sip_settings
-- Adiciona: ws_uri, ws_path, turn_server, turn_username, turn_password, stun_servers (array)
-- Esta migration é idempotente (usa IF NOT EXISTS)

BEGIN;

ALTER TABLE IF EXISTS public.sip_settings
  ADD COLUMN IF NOT EXISTS ws_uri text;

ALTER TABLE IF EXISTS public.sip_settings
  ADD COLUMN IF NOT EXISTS ws_path text;

ALTER TABLE IF EXISTS public.sip_settings
  ADD COLUMN IF NOT EXISTS turn_server text;

ALTER TABLE IF EXISTS public.sip_settings
  ADD COLUMN IF NOT EXISTS turn_username text;

ALTER TABLE IF EXISTS public.sip_settings
  ADD COLUMN IF NOT EXISTS turn_password text;

-- stun_servers: guarda uma lista (text[]) de servidores STUN, ou NULL
ALTER TABLE IF EXISTS public.sip_settings
  ADD COLUMN IF NOT EXISTS stun_servers text[];

COMMIT;

-- Opcional: Atualizar a constraint de exclusividade se necessário
-- (não alteramos constraints aqui por segurança)

COMMENT ON COLUMN public.sip_settings.ws_uri IS 'URI websocket opcional (ex: wss://sip.exemplo.com:7443)';
COMMENT ON COLUMN public.sip_settings.ws_path IS 'Caminho websocket opcional (ex: /asterisk/ws)';
COMMENT ON COLUMN public.sip_settings.turn_server IS 'URL do servidor TURN (ex: turn:1.2.3.4:3478?transport=udp)';
COMMENT ON COLUMN public.sip_settings.turn_username IS 'Usuário TURN (para lt-cred-mech)';
COMMENT ON COLUMN public.sip_settings.turn_password IS 'Senha TURN (para lt-cred-mech)';
COMMENT ON COLUMN public.sip_settings.stun_servers IS 'Array de STUN servers (text[])';
