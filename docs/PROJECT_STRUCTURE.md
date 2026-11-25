# Project structure

```text
pfc-platform/
├── index.html
├── config.js                  # Browser-safe Supabase settings
├── src/
│   ├── main.js                  # App entry point
│   ├── app/
│   │   ├── router.js            # Hash-based navigation
│   │   ├── state.js             # Session and shared state
│   │   └── shell.js             # Shared page shell and navigation
│   ├── config/
│   │   └── env.js               # Reads config.js settings
│   ├── lib/
│   │   ├── supabase.js          # Supabase client
│   │   ├── demo-store.js        # Local demo data and persistence
│   │   ├── format.js            # Formatting helpers
│   │   └── validators.js        # Client-side input checks
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── games.service.js
│   │   ├── tournaments.service.js
│   │   ├── players.service.js
│   │   ├── payments.service.js
│   │   ├── support.service.js
│   │   └── activity.service.js
│   ├── components/
│   │   ├── ui.js                # Reusable UI components
│   │   └── charts.js            # Small dashboard charts
│   ├── pages/
│   │   ├── auth.page.js
│   │   ├── player.page.js
│   │   └── operator.page.js
│   └── styles/
│       ├── tokens.css
│       ├── base.css
│       ├── components.css
│       └── responsive.css
├── supabase/
│   ├── schema.sql
│   └── README.md
└── docs/
    ├── PROJECT_STRUCTURE.md
    └── BUILD_NOTES.md
```

Database access is isolated in `services/` and Supabase setup is isolated in `lib/supabase.js` and `config/env.js`. Page layout is separated from data operations.

## Editing guide

- Change Supabase connection details in the root `config.js` file.
- Change global colours and typography in `src/styles/tokens.css`.
- Change navigation and shell layout in `src/app/shell.js`.
- Change operator screens in `src/pages/operator.page.js`.
- Change player screens in `src/pages/player.page.js`.
- Change data access in the relevant `src/services/*.service.js` file.
- Change database structure and access policies in `supabase/schema.sql`.