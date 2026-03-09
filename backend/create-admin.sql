-- ============================================================
-- Script SIMPLE pour créer un nouvel utilisateur admin
-- PostgreSQL hash automatiquement le mot de passe !
-- ============================================================
-- Instructions :
-- 1. Remplacez 'votre_email@example.com' par votre email
-- 2. Remplacez 'VotreMotDePasse2024!' par votre mot de passe
-- 3. Remplacez 'Votre Nom Complet' par votre nom
-- 4. Copiez ce script dans Supabase SQL Editor et exécutez-le
-- ============================================================

-- Activer l'extension pgcrypto si pas déjà activée
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Créer l'utilisateur admin (le mot de passe sera hashé automatiquement)
INSERT INTO users (
  id, 
  email, 
  password_hash, 
  full_name, 
  role, 
  tenant_id,
  is_active,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'votre_email@example.com',  -- ← CHANGEZ par votre email
  crypt('VotreMotDePasse2024!', gen_salt('bf', 10)),  -- ← CHANGEZ par votre mot de passe
  'Votre Nom Complet',  -- ← CHANGEZ par votre nom
  'admin_garage',
  'default',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Vérifier que l'utilisateur a bien été créé
SELECT id, email, full_name, role, is_active, created_at 
FROM users 
WHERE email = 'votre_email@example.com';
