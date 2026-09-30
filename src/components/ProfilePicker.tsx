import { useState, type FormEvent } from "react";
import type { Locale, Profile } from "../game/state";
import { messages } from "../i18n/messages";
import { avatars } from "../storage/profiles";
import { Companion } from "./Companion";
import { Emoji } from "./Emoji";
import styles from "./Puzzimori.module.css";

export function ProfilePicker({
  profiles,
  locale,
  onCreate,
  onSelect,
}: {
  profiles: Profile[];
  locale: Locale;
  onCreate: (name: string, avatar: string) => void;
  onSelect: (id: string) => void;
}) {
  const m = messages(locale);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string>(avatars[0]);
  const [invalid, setInvalid] = useState(false);
  const [showForm, setShowForm] = useState(profiles.length === 0);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || name.trim().length > 24) {
      setInvalid(true);
      return;
    }
    onCreate(name.trim(), avatar);
  }
  return (
    <section className={styles.profileSection} aria-labelledby="profile-title">
      <div className={styles.sectionHeading}>
        <div>
          <h1 id="profile-title">{m.chooseProfile}</h1>
          <p>{m.profileIntro}</p>
        </div>
        <Companion avatar={avatar} />
      </div>
      <div className={styles.profileLayout}>
        {profiles.length > 0 && (
          <div className={styles.profileList}>
            {profiles.map((profile) => (
              <button
                key={profile.id}
                className={styles.profileCard}
                onClick={() => onSelect(profile.id)}
              >
                <span className={styles.profileAvatar} aria-hidden="true">
                  {profile.avatar}
                </span>
                <span>
                  <strong>{profile.name}</strong>
                  <span className={styles.muted}>
                    {profile.completed} {m.solved}
                  </span>
                </span>
                <span className={styles.arrow} aria-hidden="true">
                  ↗
                </span>
              </button>
            ))}
          </div>
        )}
        {!showForm && (
          <button className={styles.secondaryButton} onClick={() => setShowForm(true)}>
            <span aria-hidden="true">＋</span>
            {m.newProfile}
          </button>
        )}
        {showForm && (
          <form className={styles.profileForm} onSubmit={submit} noValidate>
            <span className={styles.eyebrow}>{m.newProfile}</span>
            <label htmlFor="explorer-name">{m.name}</label>
            <input
              id="explorer-name"
              value={name}
              maxLength={24}
              placeholder={m.namePlaceholder}
              autoComplete="off"
              onChange={(event) => {
                setName(event.target.value);
                setInvalid(false);
              }}
              aria-invalid={invalid}
              aria-describedby={invalid ? "name-error" : undefined}
            />
            {invalid && (
              <p id="name-error" role="alert" className={styles.error}>
                {m.nameError}
              </p>
            )}
            <fieldset className={styles.avatarPicker}>
              <legend>{m.avatar}</legend>
              <div className={styles.avatarGrid}>
                {avatars.map((value, index) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={avatar === value}
                    className={styles.avatarButton}
                    onClick={() => setAvatar(value)}
                  >
                    <Emoji value={value} label={m.avatarNames[index]!} />
                  </button>
                ))}
              </div>
            </fieldset>
            <button className={styles.primaryButton} type="submit" disabled={profiles.length >= 30}>
              {m.create}
              <span aria-hidden="true">↗</span>
            </button>
            {profiles.length >= 30 && <p className={styles.muted}>{m.profileLimit}</p>}
          </form>
        )}
      </div>
    </section>
  );
}
