alter table awareness.readings
  drop constraint if exists readings_mode_check;

alter table awareness.readings
  drop constraint if exists awareness_readings_mode_check;

alter table awareness.readings
  add constraint awareness_readings_mode_check
  check (mode in (1, 2, 3, 4));
