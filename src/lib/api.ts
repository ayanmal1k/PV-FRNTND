import { mapSupabaseSession, supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth";

const API_URL = "supabase";
const DEFAULT_LIMIT = 20;

type ApiOptions = RequestInit & { token?: string; timeoutMs?: number };
type JsonRecord = Record<string, any>;

function camel(obj: JsonRecord | null | undefined): JsonRecord | null {
  if (!obj) return null;
  return {
    ...obj,
    firstName: obj.first_name,
    lastName: obj.last_name,
    coverImage: obj.cover_image,
    cityId: obj.city_id,
    areaId: obj.area_id,
    propertyTypeId: obj.property_type_id,
    agencyId: obj.agency_id,
    agentId: obj.agent_id,
    areaSize: obj.area_size,
    areaUnit: obj.area_unit,
    pricePerUnit: obj.price_per_unit,
    rentPeriod: obj.rent_period,
    virtualTourUrl: obj.virtual_tour_url,
    videoTourUrl: obj.video_tour_url,
    floorPlanUrl: obj.floor_plan_url,
    furnishingStatus: obj.furnishing_status,
    possessionStatus: obj.possession_status,
    builtYear: obj.built_year,
    floorsCount: obj.floors_count,
    facingDirection: obj.facing_direction,
    metaTitle: obj.meta_title,
    metaDescription: obj.meta_description,
    publishedAt: obj.published_at,
    createdAt: obj.created_at,
    updatedAt: obj.updated_at,
    isPrimary: obj.is_primary,
    publicId: obj.public_id,
    reviewCount: obj.review_count,
    minPrice: obj.min_price,
    maxPrice: obj.max_price,
    avgPrice: obj.avg_price,
    propertyCount: obj.property_count,
    activeSubscriptions: obj.active_subscriptions,
    openReports: obj.open_reports,
  };
}

function mapImage(row: JsonRecord) {
  return {
    id: row.id,
    url: row.url,
    publicId: row.public_id,
    isPrimary: row.is_primary,
    order: row.sort_order,
  };
}

function mapProperty(row: JsonRecord) {
  const propertyType = row.propertyType ?? row.property_types;
  const images = (row.images ?? row.property_images ?? []).map(mapImage);
  const agency = row.agency ?? row.agencies;
  const agent = row.agent ?? row.agents;

  return {
    ...camel(row),
    price: Number(row.price),
    areaSize: Number(row.area_size),
    pricePerUnit: row.price_per_unit == null ? null : Number(row.price_per_unit),
    aiPriceEstimate: row.ai_price_estimate == null ? null : Number(row.ai_price_estimate),
    roiPercent: row.roi_percent == null ? null : Number(row.roi_percent),
    city: camel(row.city ?? row.cities),
    area: camel(row.area ?? row.areas),
    propertyType: camel(propertyType),
    agency: agency ? camel(agency) : null,
    agent: agent
      ? {
          ...camel(agent),
          user: {
            id: agent.user_id ?? agent.id,
            firstName: "PropVault",
            lastName: "Agent",
            avatar: null,
            phone: agent.whatsapp ?? null,
            email: agency?.email ?? null,
          },
        }
      : null,
    images,
    videos: (row.property_videos ?? []).map(camel),
    amenities: (row.property_amenities ?? []).map((item: JsonRecord) => ({
      amenity: camel(item.amenities),
    })),
    nearbyPlaces: (row.nearby_places ?? []).map(camel),
  };
}

function propertySelect() {
  return `
    *,
    city:cities(*),
    area:areas(*),
    propertyType:property_types(*),
    agency:agencies(*),
    agent:agents(*),
    property_images(*),
    property_videos(*),
    property_amenities(amenities(*)),
    nearby_places(*)
  `;
}

function cardSelect() {
  return `
    *,
    city:cities(*),
    area:areas(*),
    propertyType:property_types(*),
    agency:agencies(*),
    property_images(*)
  `;
}

function parsePrice(value: string | null) {
  if (!value || value === "Any") return undefined;
  const normalized = value.toLowerCase().trim();
  const number = Number(normalized.replace(/[^0-9.]/g, ""));
  if (Number.isNaN(number)) return undefined;
  if (normalized.includes("cr")) return number * 10000000;
  if (normalized.includes("lac") || normalized.includes("lakh")) return number * 100000;
  return number;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function getSessionUser() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;
  const mapped = mapSupabaseSession(data.session);
  useAuthStore.getState().setAuth(mapped.user, mapped.accessToken, mapped.refreshToken);
  return data.session.user;
}

async function searchProperties(params: URLSearchParams) {
  const page = Number(params.get("page") ?? 1);
  const limit = Number(params.get("limit") ?? 12);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("properties")
    .select(cardSelect(), { count: "exact" })
    .eq("status", "ACTIVE");

  const purpose = params.get("purpose");
  const category = params.get("category");
  const citySlug = params.get("city");
  const cityId = params.get("cityId");
  const areaId = params.get("areaId");
  const bedrooms = params.get("bedrooms");
  const q = params.get("q");
  const featured = params.get("featured");
  const minPrice = parsePrice(params.get("minPrice"));
  const maxPrice = parsePrice(params.get("maxPrice"));

  if (purpose) query = query.eq("purpose", purpose);
  if (category) query = query.eq("category", category);
  if (cityId) query = query.eq("city_id", cityId);
  if (areaId) query = query.eq("area_id", areaId);
  if (featured === "true") query = query.eq("featured", true);
  if (bedrooms && bedrooms !== "Any") query = query.gte("bedrooms", Number.parseInt(bedrooms, 10));
  if (minPrice) query = query.gte("price", minPrice);
  if (maxPrice) query = query.lte("price", maxPrice);
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,address.ilike.%${q}%`);

  if (citySlug && !cityId) {
    const { data: city } = await supabase.from("cities").select("id").eq("slug", citySlug).maybeSingle();
    if (city?.id) query = query.eq("city_id", city.id);
  }

  switch (params.get("sort")) {
    case "price_asc":
      query = query.order("price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price", { ascending: false });
      break;
    case "featured":
      query = query.order("featured", { ascending: false }).order("created_at", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  const total = count ?? 0;
  return {
    items: (data ?? []).map(mapProperty),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

async function createProperty(body: JsonRecord) {
  const user = await getSessionUser();
  if (!user) throw new Error("Authentication required");

  const baseSlug = slugify(body.title);
  const slug = `${baseSlug}-${Date.now().toString(36)}`;
  const propertyPayload = {
    title: body.title,
    slug,
    description: body.description,
    purpose: body.purpose,
    category: body.category,
    status: body.status ?? "PENDING",
    verification: body.verification ?? "UNVERIFIED",
    price: Number(body.price),
    bedrooms: body.bedrooms == null || body.bedrooms === 0 ? null : Number(body.bedrooms),
    bathrooms: body.bathrooms == null || body.bathrooms === 0 ? null : Number(body.bathrooms),
    area_size: Number(body.areaSize),
    area_unit: body.areaUnit ?? "MARLA",
    address: body.address,
    latitude: Number(body.latitude ?? 0),
    longitude: Number(body.longitude ?? 0),
    city_id: body.cityId,
    area_id: body.areaId || null,
    property_type_id: body.propertyTypeId,
    furnishing_status: body.furnishingStatus || null,
    possession_status: body.possessionStatus || null,
    built_year: body.builtYear || null,
    floors_count: body.floorsCount || null,
    facing_direction: body.facingDirection || null,
    featured: Boolean(body.featured),
    trending: Boolean(body.trending),
    created_by: user.id,
    published_at: body.status === "ACTIVE" ? new Date().toISOString() : null,
  };

  const { data: createdProperty, error } = await supabase.from("properties").insert(propertyPayload).select(propertySelect()).single();
  if (error) throw error;
  const data = createdProperty as JsonRecord;

  if (Array.isArray(body.images) && body.images.length > 0) {
    const imageRows = body.images.map((image: JsonRecord, index: number) => ({
      property_id: data.id,
      url: image.url,
      is_primary: image.isPrimary ?? index === 0,
      sort_order: index,
      public_id: image.publicId ?? null,
    }));
    const { error: imageError } = await supabase.from("property_images").insert(imageRows);
    if (imageError) throw imageError;
  }

  const { data: fresh } = await supabase.from("properties").select(propertySelect()).eq("id", data.id).single();
  return mapProperty((fresh as JsonRecord | null) ?? data);
}

async function updateProperty(id: string, body: JsonRecord) {
  const payload: JsonRecord = {};
  const map: Record<string, string> = {
    areaSize: "area_size",
    areaUnit: "area_unit",
    cityId: "city_id",
    areaId: "area_id",
    propertyTypeId: "property_type_id",
    furnishingStatus: "furnishing_status",
    possessionStatus: "possession_status",
    builtYear: "built_year",
    floorsCount: "floors_count",
    facingDirection: "facing_direction",
  };

  for (const [key, value] of Object.entries(body)) {
    payload[map[key] ?? key] = value;
  }
  payload.updated_at = new Date().toISOString();
  if (payload.status === "ACTIVE") payload.published_at = new Date().toISOString();

  const { data, error } = await supabase.from("properties").update(payload).eq("id", id).select(propertySelect()).single();
  if (error) throw error;
  return mapProperty(data);
}

async function adminStats() {
  const [{ count: users }, { count: properties }, { count: pending }, { count: messages }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("properties").select("*", { count: "exact", head: true }).eq("status", "ACTIVE"),
    supabase.from("properties").select("*", { count: "exact", head: true }).eq("status", "PENDING"),
    supabase.from("messages").select("*", { count: "exact", head: true }).eq("status", "NEW"),
  ]);
  return { users: users ?? 0, properties: properties ?? 0, pending: pending ?? 0, activeSubscriptions: 0, openReports: messages ?? 0 };
}

async function dashboardStats() {
  const user = await getSessionUser();
  if (!user) throw new Error("Authentication required");
  const [{ count: favorites }, { count: savedSearches }, { count: messages }] = await Promise.all([
    supabase.from("favorites").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("saved_searches").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("messages").select("*", { count: "exact", head: true }).eq("user_id", user.id),
  ]);
  return { favorites: favorites ?? 0, savedSearches: savedSearches ?? 0, messages: messages ?? 0 };
}

async function route<T>(path: string, options?: ApiOptions): Promise<T> {
  const method = (options?.method ?? "GET").toUpperCase();
  const url = new URL(path, "https://propvault.local");
  const body = options?.body ? JSON.parse(String(options.body)) : {};
  const pathname = url.pathname;

  if (pathname === "/properties/search") return (await searchProperties(url.searchParams)) as T;

  if (pathname === "/properties/featured") {
    const limit = Number(url.searchParams.get("limit") ?? 8);
    const { data, error } = await supabase.from("properties").select(cardSelect()).eq("status", "ACTIVE").eq("featured", true).order("created_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return (data ?? []).map(mapProperty) as T;
  }

  if (pathname === "/properties/trending") {
    const limit = Number(url.searchParams.get("limit") ?? 8);
    const { data, error } = await supabase.from("properties").select(cardSelect()).eq("status", "ACTIVE").eq("trending", true).order("views", { ascending: false }).limit(limit);
    if (error) throw error;
    return (data ?? []).map(mapProperty) as T;
  }

  if (pathname === "/properties/cities/list") {
    const { data, error } = await supabase.from("cities").select("*").order("name");
    if (error) throw error;
    return (data ?? []).map(camel) as T;
  }

  const cityAreas = pathname.match(/^\/properties\/cities\/([^/]+)\/areas$/);
  if (cityAreas) {
    const { data, error } = await supabase.from("areas").select("*").eq("city_id", cityAreas[1]).order("name");
    if (error) throw error;
    return (data ?? []).map(camel) as T;
  }

  if (pathname === "/properties/types") {
    const { data, error } = await supabase.from("property_types").select("*").order("name");
    if (error) throw error;
    return (data ?? []).map(camel) as T;
  }

  if (pathname === "/properties/autocomplete") {
    const q = url.searchParams.get("q") ?? "";
    if (q.length < 2) return [] as T;
    const [{ data: cities }, { data: areas }] = await Promise.all([
      supabase.from("cities").select("id,name,slug").ilike("name", `%${q}%`).limit(5),
      supabase.from("areas").select("id,name,slug,city_id,cities(name)").ilike("name", `%${q}%`).limit(10),
    ]);
    return [
      ...(cities ?? []).map((c) => ({ ...c, type: "city" })),
      ...(areas ?? []).map((a: any) => ({ id: a.id, name: `${a.name}, ${a.cities?.name ?? ""}`, slug: a.slug, cityId: a.city_id, type: "area" })),
    ].slice(0, 12) as T;
  }

  if (method === "POST" && pathname === "/properties") return (await createProperty(body)) as T;

  const propertySimilar = pathname.match(/^\/properties\/([^/]+)\/similar$/);
  if (propertySimilar) {
    const slug = decodeURIComponent(propertySimilar[1]);
    const { data: property, error: propError } = await supabase.from("properties").select("*").eq("slug", slug).maybeSingle();
    if (propError) throw propError;
    if (!property) return [] as T;
    const { data, error } = await supabase
      .from("properties")
      .select(cardSelect())
      .eq("status", "ACTIVE")
      .neq("id", property.id)
      .eq("city_id", property.city_id)
      .eq("category", property.category)
      .limit(6);
    if (error) throw error;
    return (data ?? []).map(mapProperty) as T;
  }

  const propertyDetail = pathname.match(/^\/properties\/([^/]+)$/);
  if (propertyDetail && method === "GET") {
    const slug = decodeURIComponent(propertyDetail[1]);
    const { data: propertyData, error } = await supabase.from("properties").select(propertySelect()).eq("slug", slug).maybeSingle();
    if (error) throw error;
    if (!propertyData) throw new Error("Property not found");
    const data = propertyData as JsonRecord;
    void supabase.from("properties").update({ views: (data.views ?? 0) + 1 }).eq("id", data.id);
    return mapProperty(data) as T;
  }

  if (pathname === "/agencies") {
    let query = supabase.from("agencies").select("*, city:cities(*)").order("rating", { ascending: false }).limit(20);
    if (url.searchParams.get("featured") === "true") query = query.eq("featured", true);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((a) => ({ ...camel(a), city: camel((a as any).city) })) as T;
  }

  if (pathname === "/projects") {
    let query = supabase.from("projects").select("*, city:cities(*)").order("created_at", { ascending: false }).limit(20);
    if (url.searchParams.get("featured") === "true") query = query.eq("featured", true);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((p) => ({ ...camel(p), city: camel((p as any).city), minPrice: Number((p as any).min_price) })) as T;
  }

  if (pathname === "/blog") {
    const limit = Number(url.searchParams.get("limit") ?? 10);
    const { data, error, count } = await supabase.from("blog_posts").select("*", { count: "exact" }).eq("published", true).order("published_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return { items: (data ?? []).map(camel), total: count ?? 0, page: 1, limit } as T;
  }

  if (pathname === "/area-guides") {
    const { data, error } = await supabase.from("area_guides").select("*, city:cities(*), area:areas(*)").eq("published", true).order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((g) => ({ ...camel(g), city: camel((g as any).city), area: camel((g as any).area) })) as T;
  }

  if (pathname === "/users/me") {
    const user = await getSessionUser();
    if (!user) throw new Error("Authentication required");
    return useAuthStore.getState().user as T;
  }

  if (pathname === "/users/me/dashboard") return (await dashboardStats()) as T;

  if (pathname === "/favorites" && method === "GET") {
    const user = await getSessionUser();
    if (!user) throw new Error("Authentication required");
    const { data, error } = await supabase.from("favorites").select("properties(" + cardSelect() + ")").eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((f: any) => mapProperty(f.properties)).filter(Boolean) as T;
  }

  const favoriteCheck = pathname.match(/^\/favorites\/check\/([^/]+)$/);
  if (favoriteCheck) {
    const user = await getSessionUser();
    if (!user) throw new Error("Authentication required");
    const { data } = await supabase.from("favorites").select("id").eq("user_id", user.id).eq("property_id", favoriteCheck[1]).maybeSingle();
    return { favorited: Boolean(data) } as T;
  }

  const favorite = pathname.match(/^\/favorites\/([^/]+)$/);
  if (favorite) {
    const user = await getSessionUser();
    if (!user) throw new Error("Authentication required");
    if (method === "POST") {
      const { data, error } = await supabase.from("favorites").upsert({ user_id: user.id, property_id: favorite[1] }).select("*").single();
      if (error) throw error;
      return camel(data) as T;
    }
    if (method === "DELETE") {
      const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("property_id", favorite[1]);
      if (error) throw error;
      return { removed: true } as T;
    }
  }

  if (pathname === "/leads/inquiry" && method === "POST") {
    const { data: message, error } = await supabase.from("messages").insert({
      user_id: body.userId ?? null,
      property_id: body.propertyId || null,
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      subject: body.subject || "Property Inquiry",
      body: body.body,
      whatsapp: body.whatsapp ?? false,
    }).select("*").single();
    if (error) throw error;
    if (body.agentId) {
      await supabase.from("leads").insert({
        agent_id: body.agentId,
        property_id: body.propertyId || null,
        name: body.name,
        email: body.email,
        phone: body.phone || "",
        source: body.whatsapp ? "whatsapp" : "form",
      });
    }
    return { message: camel(message), whatsappLink: body.whatsapp && body.phone ? `https://wa.me/${String(body.phone).replace(/\D/g, "")}` : null } as T;
  }

  if (pathname === "/admin/dashboard") return (await adminStats()) as T;

  if (pathname === "/admin/properties") {
    const status = url.searchParams.get("status");
    let query = supabase.from("properties").select(cardSelect()).order("created_at", { ascending: false }).limit(50);
    if (status && status !== "ALL") query = query.eq("status", status);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapProperty) as T;
  }

  const adminProperty = pathname.match(/^\/admin\/properties\/([^/]+)$/);
  if (adminProperty && method === "PATCH") return (await updateProperty(adminProperty[1], body)) as T;
  if (adminProperty && method === "DELETE") {
    const { error } = await supabase.from("properties").delete().eq("id", adminProperty[1]);
    if (error) throw error;
    return { deleted: true } as T;
  }

  const approve = pathname.match(/^\/admin\/properties\/([^/]+)\/approve$/);
  if (approve && method === "POST") return (await updateProperty(approve[1], { status: "ACTIVE", verification: "VERIFIED" })) as T;

  const reject = pathname.match(/^\/admin\/properties\/([^/]+)\/reject$/);
  if (reject && method === "POST") return (await updateProperty(reject[1], { status: "REJECTED" })) as T;

  if (pathname === "/calculators/mortgage") {
    const loan = Math.max(0, Number(body.principal) - Number(body.downPayment ?? 0));
    const monthlyRate = Number(body.annualRate) / 100 / 12;
    const n = Number(body.years) * 12;
    const monthlyPayment = monthlyRate > 0 ? (loan * monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1) : loan / n;
    const totalPayment = monthlyPayment * n;
    return { monthlyPayment: Math.round(monthlyPayment), totalPayment: Math.round(totalPayment), totalInterest: Math.round(totalPayment - loan), loanAmount: loan } as T;
  }

  if (pathname === "/calculators/roi") {
    const price = Number(body.purchasePrice);
    const rent = Number(body.monthlyRent) * 12;
    const expenses = Number(body.annualExpenses ?? 0);
    const cashOnCash = price > 0 ? ((rent - expenses) / price) * 100 : 0;
    const appreciationRate = Number(body.appreciationRate ?? 5);
    return {
      annualRent: rent,
      netOperatingIncome: rent - expenses,
      cashOnCashReturn: Math.round(cashOnCash * 100) / 100,
      fiveYearProjectedValue: Math.round(price * Math.pow(1 + appreciationRate / 100, 5)),
      roiPercent: Math.round((cashOnCash + appreciationRate) * 100) / 100,
    } as T;
  }

  if (pathname === "/calculators/area-convert") {
    const units: Record<string, number> = { SQFT: 1, SQYD: 9, MARLA: 272.25, KANAL: 5445, ACRE: 43560, SQM: 10.7639 };
    const sqft = Number(body.value) * (units[body.from] || 1);
    return { value: Math.round((sqft / (units[body.to] || 1)) * 100) / 100, from: body.from, to: body.to } as T;
  }

  if (pathname.startsWith("/chat/")) return ([] as unknown) as T;

  throw new Error(`Supabase route not implemented: ${method} ${pathname}`);
}

export async function api<T>(path: string, options?: ApiOptions): Promise<T> {
  return route<T>(path, options);
}

export function getApiUrl() {
  return API_URL;
}
