-- Cover both columns used by the composite ownership foreign keys.

drop index if exists awareness.awareness_recipient_verification_client_idx;
create index awareness_recipient_verification_client_idx
  on awareness.recipient_verifications(educator_id, client_id);

drop index if exists awareness.awareness_delivery_client_idx;
create index awareness_delivery_client_idx
  on awareness.educator_report_deliveries(educator_id, client_id, created_at desc);
