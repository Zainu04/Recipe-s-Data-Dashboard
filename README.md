# Web Development Project 6 - *RecipeScope — Data Dashboard Part 2*

Submitted by: **Zainab Akhtar**

This web app: **RecipeScope is a recipe explorer built with React + Vite that fetches data from the Spoonacular API. Part 2 adds React Router for unique per-recipe detail pages, two interactive Recharts visualizations on the dashboard, and per-recipe nutrition and ingredient charts on each detail page. Users can navigate from the dashboard to any recipe's detail view and back while keeping their sidebar filters intact.**

Time spent: **12** hours spent in total

## Required Features

The following **required** functionality is completed:

- [x] **Clicking on an item in the list view displays more details about it**
  - Clicking any recipe row on the dashboard navigates to a detail view at `/recipe/:id`
  - Detail view includes extra info not shown in the dashboard: full recipe summary, step-by-step instructions, full ingredients list, nutrition radar chart (% of daily needs per nutrient), ingredient quantities bar chart, dish types, aggregate likes, Spoonacular score, and a link to the original recipe source
  - The same sidebar (search, cuisine filter, diet dropdown, max cook time slider, reset button) is displayed in the detail view as in the dashboard view

- [x] **Each detail view of an item has a direct, unique URL link to that item's detail view page**
  - URLs follow the pattern `/recipe/716429` — each recipe has its own shareable link
  - The detail view uses React Router's `useParams()` hook to extract the recipe ID from the URL

- [x] **The app includes at least two unique charts developed using the fetched data that tell an interesting story**
  - **Chart 1 — Health Score vs. Cook Time (Scatter Chart):** Each bubble represents a recipe, positioned by cook time (x-axis) vs. health score (y-axis), with bubble size encoding cost per serving. Tells the story of whether spending more time cooking leads to healthier food.
  - **Chart 2 — Recipes by Cook Time Range (Grouped Bar Chart):** Shows how many recipes fall into each time bucket (≤15m, 16–30m, 31–45m, etc.) alongside the average health score for each group. Reveals which time ranges produce the healthiest results.

The following **optional** features are implemented:

- [x] The site's customized dashboard contains more content that explains what is interesting about the data
  - Each chart includes a descriptive subtitle explaining what story it tells and how to read it
  - Chart tooltips show full recipe details (name, time, health score, price) on hover

- [x] The site allows users to toggle between different data visualizations
  - A "Hide charts ▲ / Show charts ▼" button above the charts section lets users show or hide the entire visualization panel

The following **additional** features are implemented:

* [x] Detail view fetches full recipe data including nutrition on demand via `/recipes/{id}/information?includeNutrition=true` — a separate API call using `useEffect` and `async/await`
* [x] Detail page includes two additional charts unique to each recipe: a **Nutrition Radar** (% of daily needs for Calories, Protein, Fat, Carbs, Fiber, Sugar) and an **Ingredient Quantities** horizontal bar chart
* [x] Sidebar filter state is preserved when navigating to a detail view and back to the dashboard
* [x] Recipe rows are `<Link>` elements — fully keyboard and screen-reader accessible
* [x] Graceful loading spinner and error states on both the dashboard and detail view

## Video Walkthrough

Here's a walkthrough of implemented user stories:

<img src='src/assets/recipes1.gif' title='Video Walkthrough' width='' alt='Video Walkthrough' />

<!-- Replace this with whatever GIF tool you used! -->
GIF created with KAP
<!-- Recommended tools:
[Kap](https://getkap.co/) for macOS
[ScreenToGif](https://www.screentogif.com/) for Windows
[peek](https://github.com/phw/peek) for Linux -->

## Notes

Describe any challenges encountered while building the app.

- The Spoonacular `/information` endpoint requires a separate API call per recipe to retrieve full nutrition data; this call is made on demand when a user navigates to a detail page, using `useEffect` with the recipe ID as a dependency.
- Recharts' `ScatterChart` requires a `ZAxis` component to scale bubble sizes — this was used to encode price per serving as a third visual dimension in Chart 1.
- React Router v7 uses `<Routes>` + `<Route>` (not the older `<Switch>`), and `<BrowserRouter>` must wrap the root app in `main.jsx`.
- Sharing sidebar filter state across the dashboard and detail routes required lifting all filter state up to the root `App` component and passing it down through both route components.

## License

    Copyright [2026] [Zainab Akhtar]

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.