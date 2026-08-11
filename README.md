# Armario

A mobile app for keeping track of the clothes in your wardrobe. Add each garment with a name, as
many photos as you like, a description and colour-coded tags, then find it later by searching its
name or filtering by tag. Garments can also be combined into **outfits**, saved sets you can name,
describe and tag just like the garments themselves.

Built with **React Native** and **Expo SDK 57**. Everything is stored on the device itself — no
server, no account, no internet connection required.

---

## Features

- **Add garments** with a name, photos, a description and tags. Only the name is required.
- **Several photos per garment**, from the gallery (multi-select) or the camera. The grid shows the
  cover; the detail view opens a swipeable gallery. Any photo can be promoted to cover.
- **Optional description**, a free-form notes field shown only on the detail screen.
- **Search by name**, case-insensitive.
- **Tags with colours and groups.** Every tag can be given a colour and filed under a group of your
  own naming — "estación", "tipo", "ocasión" — and the filter row lays the chips out group by group.
  The manager lives behind the **⋯ menu** at the top right, since it is set up once in a while
  rather than every day.
- **Tag autocomplete**: typing a letter or two suggests the tags already in use, so long names never
  have to be retyped.
- **Filter by tags**, combinable: selecting several tags shows only the garments that carry **all**
  of them.
- **Outfits**, on their own tab: group garments you already own into a named set, with its own
  description and tags. A garment can belong to any number of outfits but appears at most once in
  each. Outfits have the same search and grouped tag filter as the wardrobe, and tapping a garment
  inside an outfit opens it without leaving the tab.
- **Edit** any saved garment (name, photos, description and tags) or outfit.
- **Delete** garments and outfits, with a confirmation prompt. Deleting an outfit leaves its
  garments untouched; deleting a garment removes it from the outfits that were wearing it.
- **Full device rotation** (portrait, landscape and upside-down portrait), with a grid that adapts
  its column count to the available width.
- **Light and dark mode**: follows the system setting until you touch the **dark mode switch** in
  the ⋯ menu, from which point your choice is pinned and remembered between launches.
- **Persistent local storage**: the garment list lives in AsyncStorage and photos are copied into
  the app's private storage, so they survive even if you delete the original from your gallery.

---

## Requirements

- **Node.js** 20 or later
- **npm** 10 or later
- To build the native Android app:
  - **JDK 17** (for example [Eclipse Temurin 17](https://adoptium.net/temurin/releases/?version=17))
  - **Android SDK** (installed with [Android Studio](https://developer.android.com/studio))

> The JDK bundled with Android Studio (its `jbr` directory) is usually too new — JDK 21, 25 or
> later — and breaks the native build with a misleading CMake error: *"A restricted method in
> `java.lang.System` has been called"*. If `JAVA_HOME` points there, set it to a JDK 17 installation
> before building.

---

## Getting started

```bash
git clone https://github.com/<your-username>/armario-app.git
cd armario-app
npm install
npx expo start
```

With the dev server running you can open the app on:

| Target | How |
| --- | --- |
| Android emulator | press `a` in the terminal |
| iOS simulator (macOS only) | press `i` |
| Physical phone | scan the QR code with [Expo Go](https://expo.dev/go) |
| Browser | press `w` |

> To use Expo Go on a physical phone, the phone and the computer must be on the same Wi-Fi network
> and the router must not have client isolation (*AP isolation*) enabled. If it refuses to connect,
> build an APK instead (see below) rather than fighting the network.

---

## Available scripts

| Script | What it does |
| --- | --- |
| `npm start` | Starts the Expo dev server |
| `npm run android` | Builds and installs the app on an Android emulator or device |
| `npm run ios` | Same for iOS (macOS only) |
| `npm run web` | Starts the web build |
| `npm test` | Runs the test suite |
| `npm run test:watch` | Tests in interactive watch mode |
| `npm run test:coverage` | Tests with a coverage report |
| `npm run typecheck` | Type-checks the project with TypeScript |
| `npm run lint` | Runs ESLint |

---

## Tests

The project uses **Jest** with **React Native Testing Library**. These are regression tests: each
block covers one feature, and several cases carry a `Regression:` comment because they document a
real bug that was fixed and must not come back.

```bash
npm test
```

| File | What it covers |
| --- | --- |
| `wardrobe-screen.test.tsx` | Listing, name search, tag filtering and their combination, empty states |
| `garment-form.test.tsx` | Form validation, optional photo, tag handling, camera/gallery permissions, reset after saving |
| `wardrobe-context.test.tsx` | Adding, editing and deleting garments, persistence and image file management |
| `edit-delete-flow.test.tsx` | Full flow: open detail → edit → save, and delete with confirmation |
| `responsive-grid.test.tsx` | Column count and card width in portrait, landscape and on wide screens |
| `tags.test.tsx` | Tag catalogue, colours, groups, auto-registration, the ⋯ menu, the tag manager and the grouped filter |
| `images-description.test.tsx` | Several photos per garment, the gallery, the description field, tag autocomplete and the storage migration |
| `theme.test.tsx` | The light/dark preference, its persistence, and the dark mode switch in the ⋯ menu |
| `outfits.test.tsx` | Outfit storage, no repeated garment within an outfit, one garment across many outfits, the outfits screen with its search and filter, and the create/edit/delete flows |

> **On Selenium:** Selenium drives web browsers, so it does not apply to a native React Native app.
> The equivalent here is React Native Testing Library for component and integration tests (what this
> project uses) and, if on-device testing is needed later,
> [Maestro](https://maestro.mobile.dev/) or [Detox](https://wix.github.io/Detox/) for end-to-end
> tests.

---

## Continuous integration

Two GitHub Actions workflows live in [`.github/workflows`](.github/workflows):

| Workflow | Trigger | What it does |
| --- | --- | --- |
| `ci.yml` | Every pull request targeting `main` | Type-checks, lints and runs the test suite, and uploads the coverage report |
| `release.yml` | Every push to `main`, plus manual dispatch | Re-runs `ci.yml`, builds a release APK, and publishes it as a GitHub release |

`release.yml` calls `ci.yml` as a reusable workflow rather than duplicating the
steps, so an APK can never be produced from a commit whose tests failed.

### Releases

The APK is always attached to the workflow run as an artifact named
`armario-app-apk`, downloadable from the run's summary page under **Artifacts**.

On top of that, the workflow publishes a [GitHub
release](../../releases) tagged `v<version>`, where the version comes from
`expo.version` in `app.json`. The APK is attached to it as
`armario-app-v<version>.apk`, and the release notes are generated from the
commits since the previous release.

**Cutting a new release is therefore a one-line change:** bump `expo.version` in
`app.json` and merge it into `main`. Pushes that leave the version untouched
still build and upload the artifact, but reuse the existing release rather than
overwriting it.

Versions carrying a semver pre-release identifier — the current `0.1.0-alpha.4`,
for instance — are published as GitHub pre-releases, so they are not offered as
the latest stable download. Dropping the suffix (`0.1.0`) publishes a normal
release.

If you ever publish to the Play Store, remember to bump `expo.android.versionCode`
as well — Play rejects an upload whose version code has not increased.

The APK is signed with the debug keystore that `expo prebuild` generates, so the
build needs no secrets. That is fine for testing, but a Play Store release would
need a real keystore stored as an encrypted repository secret.

---

## Building an installable APK

Produces a standalone APK that runs without a computer or dev server:

```bash
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

The APK is written to `android/app/build/outputs/apk/release/app-release.apk`.

To install it on a phone: copy it to the device, open it from the file manager and allow
installation from unknown sources when Android asks.

> Use **`assembleRelease`**, not `assembleDebug`. The debug APK tries to reach the Metro dev server
> on your computer at launch and shows a black screen without it; the release APK bundles the
> JavaScript inside.
>
> By default the release APK is signed with the debug key, which is fine for testing but **not** for
> publishing on Google Play. For that you need to generate your own keystore and configure
> `signingConfigs` in `android/app/build.gradle`.

### If the native build fails

- **`ninja: error: manifest 'build.ninja' still dirty after 100 tries`** — stale CMake cache. Delete
  the `.cxx` directories (`android/.cxx`, `node_modules/*/android/.cxx`) along with `android/build`
  and `android/app/build`, then rebuild.
- **Odd build errors inside a OneDrive- or Dropbox-synced folder** — move the project to a local
  path (for example `C:\Projects\armario-app`). Sync clients interfere with the temporary files the
  native build writes.
- **`SDK location not found`** — create `android/local.properties` containing
  `sdk.dir=C:/Users/<your-username>/AppData/Local/Android/Sdk`.

---

## Project structure

```
armario-app/
├── src/
│   ├── app/                    # Screens (expo-router, file-based routing)
│   │   ├── _layout.tsx         # Root layout: theme and data provider
│   │   ├── index.tsx           # "My wardrobe": list, search and grouped filters
│   │   ├── outfits.tsx         # "Outfits": saved combinations of garments
│   │   └── add.tsx             # "Add": new garment form
│   ├── components/             # Reusable components
│   │   ├── garment-card.tsx    # Garment tile in the grid
│   │   ├── garment-form.tsx    # Form shared by the add and edit flows
│   │   ├── garment-gallery.tsx # Swipeable photo gallery for the detail view
│   │   ├── garment-picker.tsx  # Garment multi-select used when building an outfit
│   │   ├── garment-detail-modal.tsx
│   │   ├── garment-edit-modal.tsx
│   │   ├── garment-image.tsx   # Image with a fallback when there is no photo
│   │   ├── outfit-card.tsx     # Outfit tile, with a collage of its garments
│   │   ├── outfit-form.tsx     # Form shared by the create and edit flows
│   │   ├── outfit-detail-modal.tsx
│   │   ├── outfit-editor-modal.tsx
│   │   ├── tags-manager-modal.tsx  # Tag list behind the ⋯ menu
│   │   ├── tag-editor-modal.tsx  # Colour and group picker for one tag
│   │   ├── tag-picker.tsx      # Tag input with autocomplete, shared by both forms
│   │   ├── tag-filter.tsx      # Grouped filter chips, shared by both lists
│   │   ├── overflow-menu.tsx   # "⋯" dropdown in the wardrobe header
│   │   ├── tag-chip.tsx
│   │   └── button.tsx
│   ├── context/
│   │   ├── providers.tsx       # The provider stack, shared by the app and the tests
│   │   ├── theme-context.tsx   # Light/dark preference
│   │   └── wardrobe-context.tsx  # Global state and persistence
│   ├── lib/
│   │   └── persist-image.ts    # Copies photos into the app's storage
│   ├── constants/theme.ts      # Colors, spacing, radii, tag palette
│   ├── hooks/
│   ├── types/                  # Garment, Outfit and Tag shapes, plus the storage migration
│   └── __tests__/              # Regression tests
├── plugins/
│   └── with-full-sensor-orientation.js   # Enables all four orientations on Android
├── assets/images/              # App icons
└── app.json                    # Expo configuration
```

### Design decisions

- **Global state with React Context** rather than Redux or Zustand: the app has a single list of
  garments and very few operations, so an extra dependency was not worth it.
- **Images are copied into the app's private storage.** The URI returned by the image picker points
  at a temporary cache that Android may clear; copying the file means the photo survives even if the
  user deletes the original.
- **A single form component** (`GarmentForm`) backs both the add and edit flows, parameterised by
  props. This keeps the two screens from drifting apart as fields are added.
- **`orientation: "default"` is not enough on Android** to allow upside-down portrait: it maps to
  `screenOrientation="unspecified"`, which on most phones excludes the 180º rotation. The config
  plugin changes it to `fullSensor`.
- **Tags are identified by their lowercase name**, and `Garment.tags` keeps storing plain strings.
  Colours and groups live in a separate catalogue keyed by that name, so garments saved before the
  catalogue existed keep working and no data migration was needed for it. A tag typed into a garment
  form registers itself automatically with a colour from the palette.
- **Tag colours come from a fixed palette** rather than a free colour picker, which keeps the
  wardrobe visually coherent and guarantees every colour stays legible in both themes.
- **Stored garments are migrated on load** by `migrateGarment`, which turns the old single
  `imageUri` into an `imageUris` list and fills in a missing `description`. The migration runs in
  the provider, so the rest of the app only ever sees the current shape.
- **Outfits reference garments by id** instead of copying them, so renaming a garment or adding a
  photo to it shows up in every outfit at once. The cost is referential integrity, which the
  provider handles: deleting a garment also removes its id from the outfits wearing it.
- **"A garment at most once per outfit" is enforced in two places**: the picker is a toggle over a
  set, and `addOutfit`/`updateOutfit` deduplicate the list before storing it. The second check
  means the rule holds even for data that did not come through the picker.
- **Outfits are stored under their own key** (`wardrobe-outfits`), so an install that predates them
  simply loads an empty list — no migration needed.
- **The colour scheme goes through the app's own context**, not React Native's `useColorScheme`
  directly, so a stored preference can override the device setting. The hook falls back to the
  system value when no provider is mounted, which keeps a screen renderable on its own.
- **The stored preference has three states but the UI has two.** It starts at `system`, so an
  untouched install keeps following the device; flipping the switch writes `light` or `dark` and
  pins it. The switch itself only ever shows the scheme currently on screen, so its position never
  lies about what you are looking at.
- **The tab bar sets `tintColor` as well as `indicatorColor`.** The indicator is a pill drawn behind
  the selected icon; leaving it the same colour as the bar made that icon invisible.

---

## License

None. This is a personal project published without a license, which means all rights are reserved:
the code can be read here, but it is not licensed for reuse, modification or redistribution.
