import { getClient, isConfigured } from "./supabase";
import type { User } from "@supabase/supabase-js";

type AuthListener = (user: User | null) => void;

const listeners = new Set<AuthListener>();
let currentUser: User | null = null;
let initPromise: Promise<User | null> | null = null;

function notify() {
  listeners.forEach((fn) => fn(currentUser));
}

export function onAuthChange(fn: AuthListener): () => void {
  listeners.add(fn);
  fn(currentUser);
  return () => listeners.delete(fn);
}

export function getCurrentUser(): User | null {
  return currentUser;
}

async function anonSignIn(): Promise<User | null> {
  const supabase = getClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data?.user) return null;
  return data.user;
}

async function restoreSession(): Promise<User | null> {
  const supabase = getClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

export async function initAuth(): Promise<User | null> {
  if (initPromise) return initPromise;
  if (!isConfigured()) {
    initPromise = Promise.resolve(null);
    return initPromise;
  }
  initPromise = (async () => {
    let user = await restoreSession();
    if (!user) user = await anonSignIn();
    currentUser = user;
    notify();

    const supabase = getClient();
    if (supabase) {
      supabase.auth.onAuthStateChange((_event, session) => {
        currentUser = session?.user ?? null;
        notify();
      });
    }
    return user;
  })();
  return initPromise;
}

export async function signInWithEmail(email: string, password: string): Promise<User | null> {
  const supabase = getClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  currentUser = data.user;
  notify();
  return data.user;
}

export async function signUpWithEmail(email: string, password: string): Promise<User | null> {
  const supabase = getClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  currentUser = data.user;
  notify();
  return data.user;
}

export async function linkEmail(email: string, password: string): Promise<User | null> {
  const supabase = getClient();
  if (!supabase) return null;
  const anonUser = currentUser;
  if (!anonUser?.is_anonymous) throw new Error("只有匿名用户才能绑定邮箱");
  const { data, error } = await supabase.auth.updateUser({ email, password });
  if (error) throw error;
  currentUser = data.user;
  notify();
  return data.user;
}

export async function signOut(): Promise<void> {
  const supabase = getClient();
  if (!supabase) return;
  await supabase.auth.signOut();
  currentUser = null;
  notify();
}

export function isAnonymous(): boolean {
  return currentUser?.is_anonymous ?? false;
}
