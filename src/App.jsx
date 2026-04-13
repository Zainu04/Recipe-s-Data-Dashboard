import { useState, useEffect, useMemo } from 'react'
import { Routes, Route, Link, useParams } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  Cell, Legend
} from 'recharts'
import './App.css'

const API_KEY = '7be11a7efe7b42b4820d8a9fafcf8c27'

const CUISINE_OPTIONS = [
  'All', 'Italian', 'Mexican', 'Asian', 'American',
  'Mediterranean', 'Indian', 'French', 'Thai', 'Japanese'
]
const DIET_OPTIONS = [
  'All', 'vegetarian', 'vegan', 'glutenFree', 'dairyFree', 'ketogenic'
]

const TERRACOTTA = '#c4542a'
const SAGE = '#6b7c5c'
const GOLD = '#c9962b'

// ─── Sidebar (shared between dashboard + detail) ──────────────────────────────
function Sidebar({ searchQuery, setSearchQuery, cuisineFilter, setCuisineFilter,
  dietFilter, setDietFilter, maxTimeFilter, setMaxTimeFilter, onReset }) {
  return (
    <aside className="sidebar">
      <div className="sidebar__section">
        <h2 className="sidebar__heading">Search</h2>
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input type="text" className="search-input" placeholder="Search recipes..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          {searchQuery && <button className="search-clear" onClick={() => setSearchQuery('')}>✕</button>}
        </div>
      </div>

      <div className="sidebar__section">
        <h2 className="sidebar__heading">Cuisine</h2>
        <div className="filter-pills">
          {CUISINE_OPTIONS.map(c => (
            <button key={c}
              className={`filter-pill ${cuisineFilter === c ? 'filter-pill--active' : ''}`}
              onClick={() => setCuisineFilter(c)}>{c}</button>
          ))}
        </div>
      </div>

      <div className="sidebar__section">
        <h2 className="sidebar__heading">Diet</h2>
        <select className="select-input" value={dietFilter} onChange={e => setDietFilter(e.target.value)}>
          {DIET_OPTIONS.map(d => (
            <option key={d} value={d}>
              {d === 'All' ? 'All diets' : d === 'glutenFree' ? 'Gluten-Free' :
               d === 'dairyFree' ? 'Dairy-Free' : d.charAt(0).toUpperCase() + d.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="sidebar__section">
        <h2 className="sidebar__heading">
          Max cook time
          <span className="sidebar__heading-val">{maxTimeFilter === 120 ? 'Any' : `${maxTimeFilter} min`}</span>
        </h2>
        <input type="range" className="range-input" min={5} max={120} step={5}
          value={maxTimeFilter} onChange={e => setMaxTimeFilter(Number(e.target.value))} />
        <div className="range-labels"><span>5 min</span><span>2 hrs</span></div>
      </div>

      <button className="reset-btn" onClick={onReset}>Reset all filters</button>
    </aside>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
  return (
    <div className={`stat-card ${accent ? 'stat-card--accent' : ''}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  )
}

// ─── Recipe row (now a Link) ──────────────────────────────────────────────────
function RecipeRow({ recipe, rank }) {
  const healthScore = recipe.healthScore ?? 0
  const color = healthScore >= 70 ? SAGE : healthScore >= 40 ? GOLD : TERRACOTTA

  return (
    <Link to={`/recipe/${recipe.id}`} className="recipe-row" style={{ '--rank': rank }}>
      <div className="recipe-row__rank">#{rank}</div>
      <div className="recipe-row__img-wrap">
        {recipe.image
          ? <img src={recipe.image} alt={recipe.title} className="recipe-row__img" loading="lazy" />
          : <div className="recipe-row__img recipe-row__img--placeholder">🍽️</div>}
      </div>
      <div className="recipe-row__info">
        <h3 className="recipe-row__title">{recipe.title}</h3>
        <div className="recipe-row__tags">
          {recipe.vegetarian && <span className="tag tag--green">Vegetarian</span>}
          {recipe.vegan && <span className="tag tag--sage">Vegan</span>}
          {recipe.glutenFree && <span className="tag tag--gold">GF</span>}
          {recipe.dairyFree && <span className="tag tag--blue">DF</span>}
        </div>
      </div>
      <div className="recipe-row__meta">
        <div className="meta-item"><span className="meta-icon">⏱</span><span className="meta-val">{recipe.readyInMinutes ?? '—'} min</span></div>
        <div className="meta-item"><span className="meta-icon">👤</span><span className="meta-val">{recipe.servings ?? '—'} srv</span></div>
      </div>
      <div className="recipe-row__health">
        <div className="health-ring" style={{ '--score': healthScore, '--color': color }}>
          <svg viewBox="0 0 36 36" className="health-ring__svg">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--border)" strokeWidth="2.5" />
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--color)" strokeWidth="2.5"
              strokeDasharray={`${healthScore} 100`} strokeLinecap="round" transform="rotate(-90 18 18)" />
          </svg>
          <span className="health-ring__num">{healthScore}</span>
        </div>
        <span className="health-label">health</span>
      </div>
      <div className="recipe-row__price">
        {recipe.pricePerServing
          ? <><span className="price-val">${(recipe.pricePerServing / 100).toFixed(2)}</span><span className="price-label">/serving</span></>
          : <span className="price-val">—</span>}
      </div>
      <div className="recipe-row__arrow">›</div>
    </Link>
  )
}

// ─── Chart 1: Scatter — health vs time ───────────────────────────────────────
function HealthVsTimeChart({ recipes }) {
  const data = recipes
    .filter(r => r.readyInMinutes && r.healthScore != null)
    .map(r => ({
      name: r.title.length > 22 ? r.title.slice(0, 20) + '…' : r.title,
      time: r.readyInMinutes,
      health: r.healthScore,
      price: r.pricePerServing ? +(r.pricePerServing / 100).toFixed(2) : 1,
    }))

  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <h3 className="chart-title">Health Score vs. Cook Time</h3>
        <p className="chart-desc">Does spending more time cooking lead to healthier meals? Each dot is a recipe — bubble size reflects cost per serving.</p>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0d5c5" />
          <XAxis dataKey="time" name="Cook time" unit=" min" tick={{ fontSize: 11, fill: '#999' }}
            label={{ value: 'Cook Time (min)', position: 'insideBottom', offset: -15, fontSize: 11, fill: '#aaa' }} />
          <YAxis dataKey="health" name="Health score" domain={[0, 100]} tick={{ fontSize: 11, fill: '#999' }}
            label={{ value: 'Health Score', angle: -90, position: 'insideLeft', offset: 12, fontSize: 11, fill: '#aaa' }} />
          <ZAxis dataKey="price" range={[30, 300]} name="$/serving" unit="$" />
          <Tooltip content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const d = payload[0].payload
            return <div className="chart-tooltip"><strong>{d.name}</strong><div>🕐 {d.time} min · ❤️ {d.health}/100 · 💰 ${d.price}</div></div>
          }} />
          <Scatter data={data} fill={TERRACOTTA} fillOpacity={0.65} stroke={TERRACOTTA} strokeWidth={1} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Chart 2: Bar — recipes by cook time bucket ───────────────────────────────
function CookTimeBucketChart({ recipes }) {
  const buckets = [
    { label: '≤15m', min: 0, max: 15 },
    { label: '16–30m', min: 15, max: 30 },
    { label: '31–45m', min: 30, max: 45 },
    { label: '46–60m', min: 45, max: 60 },
    { label: '61–90m', min: 60, max: 90 },
    { label: '90m+', min: 90, max: Infinity },
  ]
  const data = buckets.map(b => {
    const group = recipes.filter(r => {
      const t = r.readyInMinutes ?? 0
      return t > b.min && t <= b.max
    })
    const avgHealth = group.filter(r => r.healthScore != null).length
      ? Math.round(group.filter(r => r.healthScore != null).reduce((s, r) => s + r.healthScore, 0) / group.filter(r => r.healthScore != null).length)
      : 0
    return { name: b.label, count: group.length, avgHealth }
  })

  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <h3 className="chart-title">Recipes by Cook Time Range</h3>
        <p className="chart-desc">Orange bars = recipe count in each time range. Green bars = average health score for that group.</p>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0d5c5" />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#999' }} />
          <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#999' }} />
          <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: '#aaa' }} />
          <Tooltip content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            return <div className="chart-tooltip"><strong>{label}</strong>{payload.map(p => <div key={p.name} style={{ color: p.fill }}>{p.name}: {p.value}</div>)}</div>
          }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar yAxisId="left" dataKey="count" name="# Recipes" fill={TERRACOTTA} radius={[4, 4, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? TERRACOTTA : '#e0856a'} />)}
          </Bar>
          <Bar yAxisId="right" dataKey="avgHealth" name="Avg Health Score" fill={SAGE} radius={[4, 4, 0, 0]} fillOpacity={0.75} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Dashboard view ───────────────────────────────────────────────────────────
function Dashboard({ recipes, loading, error, filtered, stats,
  sortBy, setSortBy, ...sidebarProps }) {
  const [showCharts, setShowCharts] = useState(true)

  return (
    <div className="app">
      <header className="header">
        <div className="header__inner">
          <div className="header__brand">
            <span className="header__icon">🥄</span>
            <div>
              <h1 className="header__title">RecipeScope</h1>
              <p className="header__sub">Explore the world's recipes at a glance</p>
            </div>
          </div>
          <div className="header__sort">
            <label className="sort-label">Sort by</label>
            <div className="sort-pills">
              {['popularity', 'healthiness', 'time', 'price'].map(s => (
                <button key={s}
                  className={`sort-pill ${sortBy === s ? 'sort-pill--active' : ''}`}
                  onClick={() => setSortBy(s)}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="main">
        <section className="stats-section">
          <StatCard label="Recipes shown" value={stats.shown} sub={`of ${recipes.length} fetched`} accent />
          <StatCard label="Avg cook time" value={`${stats.avgTime}m`} sub="minutes" />
          <StatCard label="Avg health score" value={stats.avgHealth} sub="out of 100" />
          <StatCard label="Vegetarian" value={`${stats.vegetarianPct}%`} sub="of results" />
          <StatCard label="Avg price/serving" value={`$${stats.avgPrice}`} />
          <StatCard label="Under 30 min" value={stats.under30} sub="quick recipes" />
        </section>

        <div className="charts-toggle-row">
          <h2 className="charts-section-title">📊 Data Insights</h2>
          <button className="toggle-charts-btn" onClick={() => setShowCharts(v => !v)}>
            {showCharts ? 'Hide charts ▲' : 'Show charts ▼'}
          </button>
        </div>

        {showCharts && filtered.length > 2 && (
          <div className="charts-grid">
            <HealthVsTimeChart recipes={filtered} />
            <CookTimeBucketChart recipes={filtered} />
          </div>
        )}

        <div className="content-grid">
          <Sidebar {...sidebarProps} />
          <section className="list-section">
            {loading && <div className="state-screen"><div className="loader" /><p>Fetching recipes…</p></div>}
            {error && (
              <div className="state-screen state-screen--error">
                <span className="state-icon">⚠️</span>
                <p><strong>API Error:</strong> {error}</p>
              </div>
            )}
            {!loading && !error && filtered.length === 0 && (
              <div className="state-screen"><span className="state-icon">🥺</span><p>No recipes match your filters.</p></div>
            )}
            {!loading && !error && filtered.length > 0 && (
              <>
                <div className="list-header">
                  <span className="list-count">{filtered.length} recipes</span>
                  <div className="list-legend"><span>Time</span><span>Servings</span><span>Health</span><span>Price</span></div>
                </div>
                <div className="recipe-list">
                  {filtered.map((recipe, i) => <RecipeRow key={recipe.id} recipe={recipe} rank={i + 1} />)}
                </div>
              </>
            )}
          </section>
        </div>
      </main>
      <footer className="footer">
        <p>Data from <a href="https://spoonacular.com" target="_blank" rel="noopener noreferrer">Spoonacular API</a> · Built with React + Vite</p>
      </footer>
    </div>
  )
}

// ─── Detail view ──────────────────────────────────────────────────────────────
function DetailView({ allRecipes, ...sidebarProps }) {
  const { id } = useParams()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const cachedRecipe = allRecipes.find(r => String(r.id) === id)

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `https://api.spoonacular.com/recipes/${id}/information?apiKey=${API_KEY}&includeNutrition=true`
        )
        if (!res.ok) throw new Error(`API error: ${res.status}`)
        const data = await res.json()
        setDetail(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [id])

  const recipe = detail || cachedRecipe

  const nutrientRadar = useMemo(() => {
    if (!detail?.nutrition?.nutrients) return []
    const targets = ['Calories', 'Protein', 'Fat', 'Carbohydrates', 'Fiber', 'Sugar']
    return targets.map(name => {
      const n = detail.nutrition.nutrients.find(n => n.name === name)
      return { nutrient: name, amount: n ? Math.round(n.amount) : 0, unit: n?.unit ?? '', pct: n ? Math.round(n.percentOfDailyNeeds) : 0 }
    })
  }, [detail])

  const ingredientData = useMemo(() => {
    if (!detail?.extendedIngredients) return []
    return detail.extendedIngredients.slice(0, 10).map(ing => ({
      name: ing.name.length > 14 ? ing.name.slice(0, 13) + '…' : ing.name,
      amount: +ing.amount.toFixed(1),
      unit: ing.unit || 'item',
    }))
  }, [detail])

  return (
    <div className="app">
      <header className="header">
        <div className="header__inner">
          <Link to="/" className="header__brand back-link">
            <span className="header__icon">🥄</span>
            <div>
              <h1 className="header__title">RecipeScope</h1>
              <p className="header__sub">Recipe Detail</p>
            </div>
          </Link>
          <Link to="/" className="back-btn">← Back to dashboard</Link>
        </div>
      </header>

      <main className="main">
        <div className="content-grid">
          <Sidebar {...sidebarProps} />

          <section className="detail-section">
            {loading && <div className="state-screen"><div className="loader" /><p>Loading recipe…</p></div>}
            {error && <div className="state-screen state-screen--error"><span className="state-icon">⚠️</span><p><strong>Error:</strong> {error}</p></div>}

            {recipe && (
              <>
                {/* Hero */}
                <div className="detail-hero">
                  {recipe.image && <img src={recipe.image} alt={recipe.title} className="detail-hero__img" />}
                  <div className="detail-hero__info">
                    <h2 className="detail-title">{recipe.title}</h2>
                    <div className="detail-tags">
                      {recipe.vegetarian && <span className="tag tag--green">Vegetarian</span>}
                      {recipe.vegan && <span className="tag tag--sage">Vegan</span>}
                      {recipe.glutenFree && <span className="tag tag--gold">Gluten-Free</span>}
                      {recipe.dairyFree && <span className="tag tag--blue">Dairy-Free</span>}
                      {recipe.cuisines?.map(c => <span key={c} className="tag tag--outline">{c}</span>)}
                    </div>
                    <div className="detail-meta-grid">
                      {[
                        { icon: '⏱', val: recipe.readyInMinutes ? `${recipe.readyInMinutes} min` : '—', label: 'Cook time' },
                        { icon: '👤', val: recipe.servings ?? '—', label: 'Servings' },
                        { icon: '❤️', val: recipe.healthScore ?? '—', label: 'Health score' },
                        { icon: '💰', val: recipe.pricePerServing ? `$${(recipe.pricePerServing / 100).toFixed(2)}` : '—', label: 'Per serving' },
                        ...(recipe.aggregateLikes != null ? [{ icon: '👍', val: recipe.aggregateLikes.toLocaleString(), label: 'Likes' }] : []),
                        ...(recipe.spoonacularScore != null ? [{ icon: '⭐', val: Math.round(recipe.spoonacularScore), label: 'Score' }] : []),
                      ].map(m => (
                        <div key={m.label} className="detail-meta-item">
                          <span className="detail-meta-icon">{m.icon}</span>
                          <span className="detail-meta-val">{m.val}</span>
                          <span className="detail-meta-label">{m.label}</span>
                        </div>
                      ))}
                    </div>
                    {recipe.sourceUrl && (
                      <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" className="source-link">
                        View original recipe ↗
                      </a>
                    )}
                  </div>
                </div>

                {/* Summary */}
                {recipe.summary && (
                  <div className="detail-summary">
                    <h3 className="detail-section-title">About this recipe</h3>
                    <p dangerouslySetInnerHTML={{ __html: recipe.summary.replace(/<a[^>]*>(.*?)<\/a>/g, '$1') }} />
                  </div>
                )}

                {/* Detail charts */}
                {(nutrientRadar.length > 0 || ingredientData.length > 0) && (
                  <div className="detail-charts-grid">
                    {nutrientRadar.length > 0 && (
                      <div className="chart-card">
                        <div className="chart-card__header">
                          <h3 className="chart-title">% of Daily Nutritional Needs</h3>
                          <p className="chart-desc">How much of your recommended daily intake does one serving cover?</p>
                        </div>
                        <ResponsiveContainer width="100%" height={240}>
                          <RadarChart data={nutrientRadar}>
                            <PolarGrid stroke="#e0d5c5" />
                            <PolarAngleAxis dataKey="nutrient" tick={{ fontSize: 11, fill: '#999' }} />
                            <Radar name="% Daily Need" dataKey="pct" stroke={TERRACOTTA} fill={TERRACOTTA} fillOpacity={0.25} />
                            <Tooltip content={({ active, payload }) => {
                              if (!active || !payload?.length) return null
                              const d = payload[0].payload
                              return <div className="chart-tooltip"><strong>{d.nutrient}</strong><div>{d.amount}{d.unit} · {d.pct}% daily need</div></div>
                            }} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    {ingredientData.length > 0 && (
                      <div className="chart-card">
                        <div className="chart-card__header">
                          <h3 className="chart-title">Ingredient Quantities</h3>
                          <p className="chart-desc">How much of each ingredient goes into this dish?</p>
                        </div>
                        <ResponsiveContainer width="100%" height={240}>
                          <BarChart data={ingredientData} layout="vertical" margin={{ left: 10, right: 24 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0d5c5" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 10, fill: '#999' }} />
                            <YAxis type="category" dataKey="name" width={95} tick={{ fontSize: 10, fill: '#777' }} />
                            <Tooltip content={({ active, payload }) => {
                              if (!active || !payload?.length) return null
                              const d = payload[0].payload
                              return <div className="chart-tooltip"><strong>{d.name}</strong><div>{d.amount} {d.unit}</div></div>
                            }} />
                            <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                              {ingredientData.map((_, i) => (
                                <Cell key={i} fill={[TERRACOTTA, SAGE, GOLD, '#e0856a', '#8fa07a', '#e8b84b'][i % 6]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                )}

                {/* Ingredients */}
                {detail?.extendedIngredients && (
                  <div className="detail-ingredients">
                    <h3 className="detail-section-title">Ingredients</h3>
                    <div className="ingredients-grid">
                      {detail.extendedIngredients.map((ing, i) => (
                        <div key={i} className="ingredient-chip">
                          <span className="ingredient-amt">{ing.amount % 1 === 0 ? ing.amount : ing.amount.toFixed(1)} {ing.unit}</span>
                          <span className="ingredient-name">{ing.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Instructions */}
                {detail?.analyzedInstructions?.[0]?.steps?.length > 0 && (
                  <div className="detail-instructions">
                    <h3 className="detail-section-title">Instructions</h3>
                    <ol className="steps-list">
                      {detail.analyzedInstructions[0].steps.map(step => (
                        <li key={step.number} className="step-item">
                          <span className="step-num">{step.number}</span>
                          <p className="step-text">{step.step}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Dish types */}
                {recipe.dishTypes?.length > 0 && (
                  <div className="detail-dish-types">
                    <h3 className="detail-section-title">Dish Types</h3>
                    <div className="detail-tags">
                      {recipe.dishTypes.map(t => <span key={t} className="tag tag--outline">{t}</span>)}
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      <footer className="footer">
        <p>Data from <a href="https://spoonacular.com" target="_blank" rel="noopener noreferrer">Spoonacular API</a> · Built with React + Vite</p>
      </footer>
    </div>
  )
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [cuisineFilter, setCuisineFilter] = useState('All')
  const [dietFilter, setDietFilter] = useState('All')
  const [maxTimeFilter, setMaxTimeFilter] = useState(120)
  const [sortBy, setSortBy] = useState('popularity')

  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true); setError(null)
      try {
        const params = new URLSearchParams({ apiKey: API_KEY, number: 50, addRecipeInformation: true, sort: sortBy, fillIngredients: false })
        const res = await fetch(`https://api.spoonacular.com/recipes/complexSearch?${params}`)
        if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
        const data = await res.json()
        setRecipes(data.results || [])
      } catch (err) { setError(err.message) }
      finally { setLoading(false) }
    }
    fetchRecipes()
  }, [sortBy])

  const filtered = useMemo(() => recipes.filter(r => {
    return r.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (cuisineFilter === 'All' || r.cuisines?.some(c => c.toLowerCase() === cuisineFilter.toLowerCase())) &&
      (dietFilter === 'All' || r[dietFilter] === true) &&
      (r.readyInMinutes ?? 0) <= maxTimeFilter
  }), [recipes, searchQuery, cuisineFilter, dietFilter, maxTimeFilter])

  const stats = useMemo(() => {
    const shown = filtered.length
    if (!shown) return { shown, avgTime: 0, avgHealth: 0, vegetarianPct: 0, avgPrice: '—', under30: 0 }
    const wTime = filtered.filter(r => r.readyInMinutes)
    const wHealth = filtered.filter(r => r.healthScore != null)
    const wPrice = filtered.filter(r => r.pricePerServing)
    return {
      shown,
      avgTime: wTime.length ? Math.round(wTime.reduce((s, r) => s + r.readyInMinutes, 0) / wTime.length) : 0,
      avgHealth: wHealth.length ? Math.round(wHealth.reduce((s, r) => s + r.healthScore, 0) / wHealth.length) : 0,
      vegetarianPct: Math.round((filtered.filter(r => r.vegetarian).length / shown) * 100),
      avgPrice: wPrice.length ? (wPrice.reduce((s, r) => s + r.pricePerServing, 0) / wPrice.length / 100).toFixed(2) : '—',
      under30: filtered.filter(r => r.readyInMinutes && r.readyInMinutes <= 30).length,
    }
  }, [filtered])

  const sidebarProps = {
    searchQuery, setSearchQuery,
    cuisineFilter, setCuisineFilter,
    dietFilter, setDietFilter,
    maxTimeFilter, setMaxTimeFilter,
    onReset: () => { setSearchQuery(''); setCuisineFilter('All'); setDietFilter('All'); setMaxTimeFilter(120) }
  }

  return (
    <Routes>
      <Route path="/" element={
        <Dashboard recipes={recipes} loading={loading} error={error}
          filtered={filtered} stats={stats} sortBy={sortBy} setSortBy={setSortBy}
          {...sidebarProps} />
      } />
      <Route path="/recipe/:id" element={
        <DetailView allRecipes={recipes} {...sidebarProps} />
      } />
    </Routes>
  )
}