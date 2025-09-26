Migration adiciona campos runtime para WSS/TURN em `sip_settings`.

Como aplicar

1. Usando o Supabase CLI (recomendado):

   - Entre no diretório do projeto e execute (logue no supabase se necessário):

```powershell
supabase db push
```

- Ou rode a migration específica (se seu fluxo usar arquivos SQL):

```powershell
psql "postgresql://USER:PASS@HOST:PORT/DBNAME" -f supabase/migrations/20250922094500_add_ws_and_turn_fields_to_sip_settings.sql
```

2. Validar as colunas adicionadas:

```powershell
psql "postgresql://USER:PASS@HOST:PORT/DBNAME" -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='sip_settings' AND column_name IN ('ws_uri','ws_path','turn_server','turn_username','turn_password','stun_servers');"
```

3. Exemplos de update (para popular as colunas) via SQL:

```sql
UPDATE public.sip_settings SET ws_uri='wss://sip.zeylox.com:7443' WHERE user_id = 'SOME-USER-ID';
UPDATE public.sip_settings SET turn_server='turn:194.163.132.247:3478?transport=udp', turn_username='1003', turn_password='MinhaSenh@123!TurnServer' WHERE user_id='SOME-USER-ID';
UPDATE public.sip_settings SET stun_servers = ARRAY['stun:stun.l.google.com:19302'] WHERE user_id='SOME-USER-ID';
```

Notas importantes

- Se sua instância Supabase usa RLS (Row Level Security) nas tabelas envolvidas, assegure que o usuário que executa a migration/updates possua privilégios ou que você aplique as mudanças via conta de serviço (service_role key) quando usar a API.
- `stun_servers` é um `text[]`. No frontend o código atual aceita uma string separada por vírgulas e persiste como array.
- Reinicie a aplicação (ou forceReconnect) após alterar as configurações para que o JS do softphone use os novos valores.
