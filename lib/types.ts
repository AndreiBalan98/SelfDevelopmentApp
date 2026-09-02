// What the database looks like, written out for TypeScript.
//
// Without this, nothing checks that "kg" is a real column or that "wieght" isn't
// a table — a typo becomes an error on your phone rather than a red line here.
// The normal way to produce this file is the Supabase CLI, which is off limits,
// so it's written by hand.
//
// **It has to be updated by hand whenever a migration changes a column.** A
// stale version of this file is worse than not having one, because it lies
// confidently.
//
// Reading it: Row is what comes back, Insert is what you may send when creating,
// Update is what you may send when changing. "?" means optional, "| null" means
// the column allows empty.

type Nullable<T> = T | null;

export type Database = {
  public: {
    Tables: {
      settings: {
        Row: {
          id: number;
          calorie_target: Nullable<number>;
          protein_target: Nullable<number>;
          added_sugar_max: Nullable<number>;
          fibre_min: Nullable<number>;
          daily_budget: Nullable<number>;
          day_boundary_hour: number;
          created_at: string;
          last_export_at: Nullable<string>;
        };
        Insert: {
          id?: number;
          calorie_target?: Nullable<number>;
          protein_target?: Nullable<number>;
          added_sugar_max?: Nullable<number>;
          fibre_min?: Nullable<number>;
          daily_budget?: Nullable<number>;
          day_boundary_hour?: number;
          last_export_at?: Nullable<string>;
        };
        Update: {
          calorie_target?: Nullable<number>;
          protein_target?: Nullable<number>;
          added_sugar_max?: Nullable<number>;
          fibre_min?: Nullable<number>;
          daily_budget?: Nullable<number>;
          day_boundary_hour?: number;
          last_export_at?: Nullable<string>;
        };
        Relationships: [];
      };

      products: {
        Row: {
          id: number;
          name: string;
          unit: "g" | "ml";
          package_price: number;
          package_quantity: number;
          ingredients_text: Nullable<string>;
          piece_grams: Nullable<number>;
          calories: number;
          protein: Nullable<number>;
          carbs: Nullable<number>;
          sugars_natural: Nullable<number>;
          sugars_added: Nullable<number>;
          fibre: Nullable<number>;
          fat: Nullable<number>;
          saturated_fat: Nullable<number>;
          salt: Nullable<number>;
          retired: boolean;
          replaced_by: Nullable<number>;
          created_at: string;
        };
        Insert: {
          name: string;
          unit: "g" | "ml";
          package_price: number;
          package_quantity: number;
          ingredients_text?: Nullable<string>;
          piece_grams?: Nullable<number>;
          calories: number;
          protein?: Nullable<number>;
          carbs?: Nullable<number>;
          sugars_natural?: Nullable<number>;
          sugars_added?: Nullable<number>;
          fibre?: Nullable<number>;
          fat?: Nullable<number>;
          saturated_fat?: Nullable<number>;
          salt?: Nullable<number>;
          retired?: boolean;
          replaced_by?: Nullable<number>;
        };
        // Everything is updatable here. Which fields you may *actually* change
        // is a rule about whether the product has been used yet (Part 4, rule
        // 1), not something a type can decide — that check lives in the action
        // that does the saving.
        Update: {
          name?: string;
          unit?: "g" | "ml";
          package_price?: number;
          package_quantity?: number;
          ingredients_text?: Nullable<string>;
          piece_grams?: Nullable<number>;
          calories?: number;
          protein?: Nullable<number>;
          carbs?: Nullable<number>;
          sugars_natural?: Nullable<number>;
          sugars_added?: Nullable<number>;
          fibre?: Nullable<number>;
          fat?: Nullable<number>;
          saturated_fat?: Nullable<number>;
          salt?: Nullable<number>;
          retired?: boolean;
          replaced_by?: Nullable<number>;
        };
        Relationships: [];
      };

      recipes: {
        Row: {
          id: number;
          name: string;
          servings: number;
          cooked_weight: Nullable<number>;
          notes: Nullable<string>;
          retired: boolean;
          replaced_by: Nullable<number>;
          created_at: string;
        };
        Insert: {
          name: string;
          servings: number;
          cooked_weight?: Nullable<number>;
          notes?: Nullable<string>;
          retired?: boolean;
          replaced_by?: Nullable<number>;
        };
        // As with products, *which* of these you may actually change is a rule
        // about whether the recipe has been eaten yet (Part 4, rule 2), not
        // something a type can decide — that check lives in the action that
        // does the saving. cooked_weight is the exception: nothing calculates
        // from it, so it stays editable forever.
        Update: {
          name?: string;
          servings?: number;
          cooked_weight?: Nullable<number>;
          notes?: Nullable<string>;
          retired?: boolean;
          replaced_by?: Nullable<number>;
        };
        Relationships: [];
      };

      recipe_items: {
        Row: {
          id: number;
          recipe_id: number;
          product_id: number;
          quantity: number;
          created_at: string;
        };
        Insert: { recipe_id: number; product_id: number; quantity: number };
        Update: { quantity?: number };
        Relationships: [];
      };

      meals: {
        Row: {
          id: number;
          eaten_at: string;
          day: string;
          type: "meal" | "snack";
          note: Nullable<string>;
          score: Nullable<number>;
          created_at: string;
        };
        Insert: {
          eaten_at: string;
          day: string;
          type: "meal" | "snack";
          note?: Nullable<string>;
          score?: Nullable<number>;
        };
        Update: {
          eaten_at?: string;
          day?: string;
          type?: "meal" | "snack";
          note?: Nullable<string>;
          score?: Nullable<number>;
        };
        Relationships: [];
      };

      meal_items: {
        Row: {
          id: number;
          meal_id: number;
          product_id: Nullable<number>;
          recipe_id: Nullable<number>;
          quantity: Nullable<number>;
          quantity_unit: Nullable<"unit" | "piece">;
          servings: Nullable<number>;
          created_at: string;
        };
        Insert: {
          meal_id: number;
          product_id?: Nullable<number>;
          recipe_id?: Nullable<number>;
          quantity?: Nullable<number>;
          quantity_unit?: Nullable<"unit" | "piece">;
          servings?: Nullable<number>;
        };
        Update: {
          quantity?: Nullable<number>;
          quantity_unit?: Nullable<"unit" | "piece">;
          servings?: Nullable<number>;
        };
        Relationships: [];
      };

      sleep: {
        Row: {
          id: number;
          date: string;
          bedtime: Nullable<string>;
          wake_time: Nullable<string>;
          quality: Nullable<number>;
          notes: Nullable<string>;
          created_at: string;
        };
        Insert: {
          date: string;
          bedtime?: Nullable<string>;
          wake_time?: Nullable<string>;
          quality?: Nullable<number>;
          notes?: Nullable<string>;
        };
        Update: {
          date?: string;
          bedtime?: Nullable<string>;
          wake_time?: Nullable<string>;
          quality?: Nullable<number>;
          notes?: Nullable<string>;
        };
        Relationships: [];
      };

      weight: {
        Row: {
          id: number;
          date: string;
          kg: number;
          notes: Nullable<string>;
          created_at: string;
        };
        Insert: { date: string; kg: number; notes?: Nullable<string> };
        Update: { date?: string; kg?: number; notes?: Nullable<string> };
        Relationships: [];
      };

      smoking: {
        Row: {
          id: number;
          date: string;
          count: number;
          notes: Nullable<string>;
          created_at: string;
        };
        Insert: { date: string; count: number; notes?: Nullable<string> };
        Update: { date?: string; count?: number; notes?: Nullable<string> };
        Relationships: [];
      };

      login_attempts: {
        Row: { id: number; at: string };
        Insert: { at?: string };
        Update: { at?: string };
        Relationships: [];
      };
    };
    // Written this way, not as Record<string, never>: an empty Record is keyed
    // by *any* string, which would quietly make every table name valid again.
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
  };
};

export type WeightRow = Database["public"]["Tables"]["weight"]["Row"];
