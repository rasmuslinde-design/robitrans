import "./App.css";

import { useEffect, useMemo, useState } from "react";

function StockImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  // If an external image fails (CSP/hotlink/URL), fall back to an inline SVG placeholder.
  const fallback =
    "data:image/svg+xml;charset=utf-8," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="700" viewBox="0 0 1200 700">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#333333" />
            <stop offset="1" stop-color="#666666" />
          </linearGradient>
        </defs>
        <rect width="1200" height="700" fill="url(#g)" />
        <rect x="60" y="60" width="1080" height="580" rx="28" fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.25)" />
        <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="42" fill="#ffffff" opacity="0.9">${alt}</text>
      </svg>`,
    );

  return (
    <img
      className={className}
      src={failed ? fallback : src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

type RentType = "JUHIGA" | "JUHITA";

type MachineType = "KRAANAUTO" | "TOSTUK";

type BookingInput = {
  machineType: MachineType | "";
  date: string;
  name: string;
  email: string;
  phone: string;
  rentType: RentType | "";
  additionalInfo: string;
};

type BookingRow = {
  id: string;
  date: string;
  machineType?: MachineType;
  rentType: RentType;
  name: string;
  email: string;
  phone: string;
  additionalInfo: string;
  createdAt: string;
};

type Machine = {
  id: string;
  name: string;
  description: string;
  features: string[];
  imageUrl: string;
  createdAt: string;
};

type AdminMachine = Machine & { active: 0 | 1 };

function isoMonth(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function isWeekend(d: Date) {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function toIsoDateLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildCalendarDays(viewDate: Date) {
  const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const start = new Date(firstOfMonth);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="nav">
      <div className="nav__left">
        <div className="logo">
          <img
            className="brandLogo"
            src="/tekstigatraktor.png"
            alt="RobiTrans OÜ"
          />
        </div>
      </div>

      <button
        className="burger"
        type="button"
        aria-label="Ava menüü"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="burger__bar" />
        <span className="burger__bar" />
        <span className="burger__bar" />
      </button>

      <nav className={open ? "nav__right is-open" : "nav__right"}>
        <a className="nav__link" href="#home" onClick={() => setOpen(false)}>
          Home
        </a>
        <a className="nav__link" href="#masinad" onClick={() => setOpen(false)}>
          Masinad
        </a>
        <a
          className="nav__link"
          href="#broneerimine"
          onClick={() => setOpen(false)}
        >
          Broneerimine
        </a>
        <a
          className="nav__link"
          href="#tehtud-tood"
          onClick={() => setOpen(false)}
        >
          Tehtud tööd
        </a>
      </nav>
    </header>
  );
}

function Hero({
  onPrimary,
  onSecondary,
}: {
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  return (
    <section id="home" className="hero">
      <StockImage className="hero__bg" src="/crane.jpg" alt="Kraana tööhoos" />
      <div className="hero__overlay" />
      <div className="hero__content">
        <h1>Kiire ja soodne masinate rentimine</h1>
        <p>
          Rendime usaldusväärseid masinaid töödeks, mis vajavad jõudu, kõrgust
          ja täpsust. Broneeri kuupäev paari minutiga.
        </p>
        <div className="hero__actions">
          <button className="btn btn--primary" onClick={onPrimary}>
            Vaata masinaid
          </button>
          <button className="btn btn--ghost" onClick={onSecondary}>
            Broneerimine
          </button>
        </div>
      </div>
    </section>
  );
}

function Section({ id, title, subtitle, children }: any) {
  return (
    <section
      id={id}
      className={[
        "section",
        id === "broneerimine" ? "section--booking" : "",
      ].join(" ")}
    >
      <div className="container">
        <div className="section__head">
          <h2>{title}</h2>
          {subtitle ? <p className="muted">{subtitle}</p> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

function Machines() {
  const [items, setItems] = useState<Machine[]>([]);

  useEffect(() => {
    fetch("/api/machines")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { machines: Machine[] }) => {
        setItems(Array.isArray(data.machines) ? data.machines : []);
      })
      .catch(() => {
        // ignore
      });
  }, []);

  return (
    <div className="grid grid--cards">
      {items.map((m) => (
        <article key={m.id} className="card">
          <StockImage className="machineImg" src={m.imageUrl} alt={m.name} />
          <h3>{m.name}</h3>
          <p className="muted">{m.description}</p>
          <ul className="list">
            {m.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

function Works() {
  const items = [
    {
      title: "Paigaldus ja tõstetööd",
      desc: "Aitame tõsta ja paigaldada elemente, seadmeid ja materjale nii sise- kui välitingimustes.",
      image: "/paigaldus.webp",
    },
    {
      title: "Transport ja laadimine",
      desc: "Masinate ja materjalide liigutamine ning logistiline abi objektil.",
      image: "/transport.png",
    },
    {
      title: "Lao- ja platsitööd",
      desc: "Tõstukiga kauba liigutamine, ladustamine ja komplekteerimine.",
      image: "/warehouse.jpg",
    },
  ];

  return (
    <div className="grid grid--3">
      {items.map((x) => (
        <div key={x.title} className="card card--flat">
          <StockImage className="workImg" src={x.image} alt={x.title} />
          <h3>{x.title}</h3>
          <p className="muted">{x.desc}</p>
        </div>
      ))}
    </div>
  );
}

function Booking() {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [bookedDates, setBookedDates] = useState<Set<string>>(() => new Set());

  const [form, setForm] = useState<BookingInput>({
    machineType: "",
    date: "",
    name: "",
    email: "",
    phone: "",
    rentType: "",
    additionalInfo: "",
  });
  const [status, setStatus] = useState<{
    kind: "idle" | "loading" | "ok" | "err";
    msg?: string;
  }>({ kind: "idle" });

  const calendarDays = useMemo(() => buildCalendarDays(viewDate), [viewDate]);

  useEffect(() => {
    const month = isoMonth(viewDate);
    fetch(`/api/availability?month=${month}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { bookedDates: string[] }) => {
        setBookedDates(new Set(data.bookedDates ?? []));
      })
      .catch(() => {
        // ignore
      });
  }, [viewDate]);

  useEffect(() => {
    setForm((f) => ({ ...f, date: selectedDate }));
  }, [selectedDate]);

  function prevMonth() {
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() - 1);
    setViewDate(d);
  }
  function nextMonth() {
    const d = new Date(viewDate);
    d.setMonth(d.getMonth() + 1);
    setViewDate(d);
  }

  const canSubmit =
    form.machineType &&
    form.date &&
    form.name.trim() &&
    form.email.trim() &&
    form.phone.trim() &&
    form.rentType &&
    form.additionalInfo.trim();

  async function submit() {
    if (!canSubmit) {
      setStatus({ kind: "err", msg: "Palun täida kõik väljad." });
      return;
    }
    setStatus({ kind: "loading" });

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        machineType: form.machineType,
        date: form.date,
        name: form.name,
        email: form.email,
        phone: form.phone,
        rentType: form.rentType,
        additionalInfo: form.additionalInfo,
      }),
    });

    if (res.ok) {
      setStatus({
        kind: "ok",
        msg: "Broneering saadetud! Võtame ühendust esimesel võimalusel.",
      });
      setBookedDates((s) => new Set([...s, form.date]));
    } else {
      const data = await res.json().catch(() => ({}));
      setStatus({
        kind: "err",
        msg: (data as any)?.message ?? "Broneerimine ebaõnnestus.",
      });
    }
  }

  return (
    <div className="booking">
      <div className="booking__calendar">
        <div className="cal__head">
          <button
            className="btn btn--small"
            onClick={prevMonth}
            aria-label="Eelmine kuu"
          >
            ‹
          </button>
          <div className="cal__title">
            {viewDate.toLocaleString("et-EE", {
              month: "long",
              year: "numeric",
            })}
          </div>
          <button
            className="btn btn--small"
            onClick={nextMonth}
            aria-label="Järgmine kuu"
          >
            ›
          </button>
        </div>
        <div className="cal__grid cal__weekdays">
          {["E", "T", "K", "N", "R", "L", "P"].map((x) => (
            <div key={x} className="cal__weekday">
              {x}
            </div>
          ))}
        </div>
        <div className="cal__grid">
          {calendarDays.map((d) => {
            const inMonth = d.getMonth() === viewDate.getMonth();
            const iso = toIsoDateLocal(d);
            const weekend = isWeekend(d);
            const booked = bookedDates.has(iso);
            const disabled = !inMonth || weekend || booked;
            const selected = selectedDate === iso;

            return (
              <button
                key={iso}
                className={[
                  "cal__day",
                  inMonth ? "" : "is-out",
                  weekend ? "is-weekend" : "",
                  booked ? "is-booked" : "",
                  selected ? "is-selected" : "",
                ].join(" ")}
                disabled={disabled}
                onClick={() => setSelectedDate(iso)}
                title={
                  booked
                    ? "Broneeritud"
                    : weekend
                      ? "Nädalavahetus (broneerimine pole võimalik)"
                      : "Vaba"
                }
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>
        <div className="cal__legend">
          <span>
            <i className="dot dot--free" /> Vaba
          </span>
          <span>
            <i className="dot dot--booked" /> Broneeritud
          </span>
          <span>
            <i className="dot dot--weekend" /> Nädalavahetus
          </span>
        </div>
      </div>

      <div className="booking__form">
        <div className="form">
          <div className="form__row">
            <label>Masin</label>
            <select
              value={form.machineType}
              onChange={(e) =>
                setForm({ ...form, machineType: e.target.value as MachineType })
              }
            >
              <option value="">Vali…</option>
              <option value="KRAANAUTO">Kraanaauto</option>
              <option value="TOSTUK">Tõstuk (forklift)</option>
            </select>
          </div>
          <div className="form__row">
            <label>Kuupäev</label>
            <input
              value={form.date}
              readOnly
              placeholder="Vali vasakult kalendrist"
            />
          </div>
          <div className="form__row">
            <label>Nimi</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="form__row">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="form__row">
            <label>Telefoni number</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="form__row">
            <label>Rent</label>
            <select
              value={form.rentType}
              onChange={(e) =>
                setForm({ ...form, rentType: e.target.value as RentType })
              }
            >
              <option value="">Vali…</option>
              <option value="JUHIGA">Juhiga rent</option>
              <option value="JUHITA">Juhita rent</option>
            </select>
          </div>
          <div className="form__row">
            <label>Lisa info</label>
            <textarea
              rows={4}
              value={form.additionalInfo}
              onChange={(e) =>
                setForm({ ...form, additionalInfo: e.target.value })
              }
              placeholder="Kirjelda lühidalt tööd, asukohta, ajaraami jne."
            />
          </div>

          {status.kind === "ok" ? (
            <div className="notice notice--ok">{status.msg}</div>
          ) : null}
          {status.kind === "err" ? (
            <div className="notice notice--err">{status.msg}</div>
          ) : null}

          <button
            className="btn btn--primary"
            disabled={!canSubmit || status.kind === "loading"}
            onClick={submit}
          >
            {status.kind === "loading" ? "Saadan…" : "Broneeri"}
          </button>
          <p className="muted" style={{ marginTop: 10 }}>
            Broneerida ei saa nädalavahetusi. Broneeritud kuupäevad on kalendris
            märgitud.
          </p>
        </div>
      </div>
    </div>
  );
}

function Admin() {
  const [token, setToken] = useState<string>(
    () => localStorage.getItem("adminToken") ?? "",
  );
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [tab, setTab] = useState<"bookings" | "machines">("bookings");
  const [bookings, setBookings] = useState<BookingRow[]>([]);

  const [machines, setMachines] = useState<AdminMachine[]>([]);
  const [newMachine, setNewMachine] = useState<{
    name: string;
    description: string;
    imageUrl: string;
    features: string;
  }>({ name: "", description: "", imageUrl: "", features: "" });

  const [editing, setEditing] = useState<null | {
    id: string;
    machineType: MachineType;
    date: string;
    rentType: RentType;
    name: string;
    email: string;
    phone: string;
    additionalInfo: string;
  }>(null);

  const [editingMachine, setEditingMachine] = useState<null | {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    active: 0 | 1;
    features: string;
  }>(null);

  async function login() {
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      setError("Vale kasutajanimi või parool");
      return;
    }
    const data = (await res.json()) as { token: string };
    setToken(data.token);
    localStorage.setItem("adminToken", data.token);
  }

  async function loadBookings(currentToken: string) {
    setError("");
    const res = await fetch("/api/admin/bookings", {
      headers: { Authorization: `Bearer ${currentToken}` },
    });
    if (!res.ok) {
      setError("Pole lubatud või sessioon aegus.");
      return;
    }
    const data = (await res.json()) as { bookings: BookingRow[] };
    setBookings(data.bookings);
  }

  async function loadMachines(currentToken: string) {
    setError("");
    const res = await fetch("/api/admin/machines", {
      headers: { Authorization: `Bearer ${currentToken}` },
    });
    if (!res.ok) {
      setError("Pole lubatud või sessioon aegus.");
      return;
    }
    const data = (await res.json()) as { machines: AdminMachine[] };
    setMachines(data.machines ?? []);
  }

  function machineLabel(m?: MachineType) {
    return m === "KRAANAUTO" ? "Kraanaauto" : "Tõstuk";
  }

  async function deleteBooking(id: string) {
    setError("");
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError((data as any)?.message ?? "Kustutamine ebaõnnestus.");
      return;
    }
    await loadBookings(token);
  }

  async function saveEdit() {
    if (!editing) return;
    setError("");
    const res = await fetch(`/api/admin/bookings/${editing.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        machineType: editing.machineType,
        date: editing.date,
        rentType: editing.rentType,
        name: editing.name,
        email: editing.email,
        phone: editing.phone,
        additionalInfo: editing.additionalInfo,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError((data as any)?.message ?? "Muutmine ebaõnnestus.");
      return;
    }

    setEditing(null);
    await loadBookings(token);
  }

  function parseFeatureLines(raw: string): string[] {
    return raw
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);
  }

  async function createMachine() {
    setError("");
    const features = parseFeatureLines(newMachine.features);
    const res = await fetch("/api/admin/machines", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: newMachine.name,
        description: newMachine.description,
        imageUrl: newMachine.imageUrl,
        features,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError((data as any)?.message ?? "Lisamine ebaõnnestus.");
      return;
    }
    setNewMachine({ name: "", description: "", imageUrl: "", features: "" });
    await loadMachines(token);
  }

  async function deleteMachine(id: string) {
    setError("");
    const res = await fetch(`/api/admin/machines/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError((data as any)?.message ?? "Kustutamine ebaõnnestus.");
      return;
    }
    await loadMachines(token);
  }

  async function saveMachineEdit() {
    if (!editingMachine) return;
    setError("");
    const res = await fetch(`/api/admin/machines/${editingMachine.id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: editingMachine.name,
        description: editingMachine.description,
        imageUrl: editingMachine.imageUrl,
        active: editingMachine.active,
        features: parseFeatureLines(editingMachine.features),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError((data as any)?.message ?? "Muutmine ebaõnnestus.");
      return;
    }

    setEditingMachine(null);
    await loadMachines(token);
  }

  useEffect(() => {
    if (token) {
      loadBookings(token);
      loadMachines(token);
    }
  }, [token]);

  if (!token) {
    return (
      <div className="container" style={{ padding: "40px 0" }}>
        <div className="adminCard">
          <h1>Admin dashboard</h1>
          <p className="muted">Logi sisse, et vaadata broneeringuid.</p>
          <div className="form">
            <div className="form__row">
              <label>Kasutajanimi</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="form__row">
              <label>Parool</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error ? <div className="notice notice--err">{error}</div> : null}
            <button className="btn btn--primary" onClick={login}>
              Logi sisse
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="nav">
        <div className="nav__left">
          <div className="logo">
            <img
              className="brandLogo"
              src="/tekstigatraktor.png"
              alt="RobiTrans OÜ"
            />
          </div>
        </div>

        <nav className="nav__right">
          <button
            type="button"
            className="nav__link"
            onClick={() => setTab("bookings")}
            aria-current={tab === "bookings" ? "page" : undefined}
          >
            Broneeringud
          </button>
          <button
            type="button"
            className="nav__link"
            onClick={() => setTab("machines")}
            aria-current={tab === "machines" ? "page" : undefined}
          >
            Masinad
          </button>
          <button
            type="button"
            className="nav__link"
            onClick={() =>
              tab === "bookings" ? loadBookings(token) : loadMachines(token)
            }
          >
            Värskenda
          </button>
          <button
            type="button"
            className="nav__link"
            onClick={() => {
              localStorage.removeItem("adminToken");
              setToken("");
              window.location.assign("/");
            }}
          >
            Logi välja
          </button>
        </nav>
      </header>

      <div className="container" style={{ padding: "40px 0" }}>
        <div className="adminHead">
          <h1>{tab === "bookings" ? "Broneeringud" : "Masinad"}</h1>
        </div>

        {error ? <div className="notice notice--err">{error}</div> : null}

        {tab === "bookings" ? (
          <>
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Masin</th>
                    <th>Kuupäev</th>
                    <th>Rent</th>
                    <th>Nimi</th>
                    <th>Email</th>
                    <th>Telefon</th>
                    <th>Lisa info</th>
                    <th>Loodud</th>
                    <th>Tegevused</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td>{machineLabel(b.machineType)}</td>
                      <td>{b.date}</td>
                      <td>{b.rentType === "JUHIGA" ? "Juhiga" : "Juhita"}</td>
                      <td>{b.name}</td>
                      <td>{b.email}</td>
                      <td>{b.phone}</td>
                      <td style={{ maxWidth: 380 }}>{b.additionalInfo}</td>
                      <td>{new Date(b.createdAt).toLocaleString("et-EE")}</td>
                      <td>
                        <div
                          style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                        >
                          <button
                            className="btn btn--small"
                            onClick={() =>
                              setEditing({
                                id: b.id,
                                machineType: (b.machineType ??
                                  "TOSTUK") as MachineType,
                                date: b.date,
                                rentType: b.rentType,
                                name: b.name,
                                email: b.email,
                                phone: b.phone,
                                additionalInfo: b.additionalInfo,
                              })
                            }
                          >
                            Muuda
                          </button>
                          <button
                            className="btn btn--small"
                            onClick={() => deleteBooking(b.id)}
                          >
                            Kustuta
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="muted">
                        Broneeringuid pole.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            {editing ? (
              <div className="adminCard" style={{ marginTop: 20 }}>
                <h2>Muuda broneeringut</h2>
                <div className="form">
                  <div className="form__row">
                    <label>Masin</label>
                    <select
                      value={editing.machineType}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          machineType: e.target.value as MachineType,
                        })
                      }
                    >
                      <option value="KRAANAUTO">Kraanaauto</option>
                      <option value="TOSTUK">Tõstuk</option>
                    </select>
                  </div>
                  <div className="form__row">
                    <label>Kuupäev</label>
                    <input
                      type="date"
                      value={editing.date}
                      onChange={(e) =>
                        setEditing({ ...editing, date: e.target.value })
                      }
                    />
                  </div>
                  <div className="form__row">
                    <label>Rent</label>
                    <select
                      value={editing.rentType}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          rentType: e.target.value as RentType,
                        })
                      }
                    >
                      <option value="JUHIGA">Juhiga rent</option>
                      <option value="JUHITA">Juhita rent</option>
                    </select>
                  </div>
                  <div className="form__row">
                    <label>Nimi</label>
                    <input
                      value={editing.name}
                      onChange={(e) =>
                        setEditing({ ...editing, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="form__row">
                    <label>Email</label>
                    <input
                      type="email"
                      value={editing.email}
                      onChange={(e) =>
                        setEditing({ ...editing, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="form__row">
                    <label>Telefon</label>
                    <input
                      value={editing.phone}
                      onChange={(e) =>
                        setEditing({ ...editing, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="form__row">
                    <label>Lisa info</label>
                    <textarea
                      rows={4}
                      value={editing.additionalInfo}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          additionalInfo: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button className="btn btn--primary" onClick={saveEdit}>
                      Salvesta
                    </button>
                    <button
                      className="btn btn--small"
                      onClick={() => setEditing(null)}
                    >
                      Tühista
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <div className="adminCard" style={{ marginTop: 10 }}>
              <h2>Lisa uus masin</h2>
              <div className="form">
                <div className="form__row">
                  <label>Nimi</label>
                  <input
                    value={newMachine.name}
                    onChange={(e) =>
                      setNewMachine({ ...newMachine, name: e.target.value })
                    }
                  />
                </div>
                <div className="form__row">
                  <label>Kirjeldus</label>
                  <textarea
                    rows={3}
                    value={newMachine.description}
                    onChange={(e) =>
                      setNewMachine({
                        ...newMachine,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form__row">
                  <label>Pildi URL</label>
                  <input
                    placeholder="Näiteks /forklift.avif või https://..."
                    value={newMachine.imageUrl}
                    onChange={(e) =>
                      setNewMachine({ ...newMachine, imageUrl: e.target.value })
                    }
                  />
                </div>
                <div className="form__row">
                  <label>Omadused (1 rida = 1 punkt)</label>
                  <textarea
                    rows={4}
                    value={newMachine.features}
                    onChange={(e) =>
                      setNewMachine({ ...newMachine, features: e.target.value })
                    }
                    placeholder="Paindlik rendiaeg\nHooldatud tehnika\nKõrge töökindlus"
                  />
                </div>
                <button className="btn btn--primary" onClick={createMachine}>
                  Postita
                </button>
              </div>
            </div>

            <div className="tableWrap" style={{ marginTop: 20 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Nimi</th>
                    <th>Pilt</th>
                    <th>Aktiivne</th>
                    <th>Loodud</th>
                    <th>Tegevused</th>
                  </tr>
                </thead>
                <tbody>
                  {machines.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{m.name}</div>
                        <div className="muted" style={{ maxWidth: 520 }}>
                          {m.description}
                        </div>
                      </td>
                      <td style={{ width: 140 }}>
                        <StockImage
                          className="machineImg"
                          src={m.imageUrl}
                          alt={m.name}
                        />
                      </td>
                      <td>{m.active ? "Jah" : "Ei"}</td>
                      <td>{new Date(m.createdAt).toLocaleString("et-EE")}</td>
                      <td>
                        <div
                          style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                        >
                          <button
                            className="btn btn--small"
                            onClick={() =>
                              setEditingMachine({
                                id: m.id,
                                name: m.name,
                                description: m.description,
                                imageUrl: m.imageUrl,
                                active: m.active,
                                features: (m.features ?? []).join("\n"),
                              })
                            }
                          >
                            Muuda
                          </button>
                          <button
                            className="btn btn--small"
                            onClick={() => deleteMachine(m.id)}
                          >
                            Eemalda
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {machines.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="muted">
                        Masinaid pole.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            {editingMachine ? (
              <div className="adminCard" style={{ marginTop: 20 }}>
                <h2>Muuda masinat</h2>
                <div className="form">
                  <div className="form__row">
                    <label>Nimi</label>
                    <input
                      value={editingMachine.name}
                      onChange={(e) =>
                        setEditingMachine({
                          ...editingMachine,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form__row">
                    <label>Kirjeldus</label>
                    <textarea
                      rows={3}
                      value={editingMachine.description}
                      onChange={(e) =>
                        setEditingMachine({
                          ...editingMachine,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form__row">
                    <label>Pildi URL</label>
                    <input
                      value={editingMachine.imageUrl}
                      onChange={(e) =>
                        setEditingMachine({
                          ...editingMachine,
                          imageUrl: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form__row">
                    <label>Aktiivne</label>
                    <select
                      value={String(editingMachine.active)}
                      onChange={(e) =>
                        setEditingMachine({
                          ...editingMachine,
                          active: e.target.value === "1" ? 1 : 0,
                        })
                      }
                    >
                      <option value="1">Jah</option>
                      <option value="0">Ei</option>
                    </select>
                  </div>
                  <div className="form__row">
                    <label>Omadused (1 rida = 1 punkt)</label>
                    <textarea
                      rows={4}
                      value={editingMachine.features}
                      onChange={(e) =>
                        setEditingMachine({
                          ...editingMachine,
                          features: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button
                      className="btn btn--primary"
                      onClick={saveMachineEdit}
                    >
                      Salvesta
                    </button>
                    <button
                      className="btn btn--small"
                      onClick={() => setEditingMachine(null)}
                    >
                      Tühista
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <div className="logo logo--footer">
            <img
              className="brandLogo brandLogo--footer"
              src="/footerlogo.png"
              alt="RobiTrans OÜ"
            />
          </div>
          <p className="muted">Masinate rent ja tööde teostus üle Eesti.</p>
        </div>
        <div>
          <h4>Kontakt</h4>
          <p>
            Telefon: <a href="tel:+37256212888">+372 56212888</a>
          </p>
          <p>
            Email: <a href="mailto:info@robitrans.ee">info@robitrans.ee</a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const isAdminRoute =
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/admin");

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (isAdminRoute) {
    return <Admin />;
  }

  return (
    <div>
      <NavBar />
      <Hero
        onPrimary={() => scrollTo("masinad")}
        onSecondary={() => scrollTo("broneerimine")}
      />

      <Section
        id="masinad"
        title="Masinad"
        subtitle="Vali sobiv masin ja broneeri endale sobiv tööpäev (E–R)."
      >
        <Machines />
      </Section>

      <Section
        id="broneerimine"
        title="Broneerimine"
        subtitle="Vaata vabu aegu ja saada broneering. Vastame esimesel võimalusel."
      >
        <Booking />
      </Section>

      <Section
        id="tehtud-tood"
        title="Tehtud tööd"
        subtitle="Mõned näited töödest, mida teeme."
      >
        <Works />
      </Section>

      <Footer />
    </div>
  );
}
