# OBS-Demo — Claude Code notları

Akademik bilgi sistemi (öğrenci bilgi sistemi). Portföy projesi; hedef, StockTracker projesi seviyesinde sağlam ve testli bir backend.
Geliştirici: Berat (macOS, JetBrains Rider). Konuşma dili Türkçe; kod, commit mesajları ve kod içi yorumlar İngilizce.

## Yapı

- `backend/`: Spring Boot 3.4, Java 21, Gradle, Spring Security + JWT (jjwt 0.11), JPA/Hibernate, PostgreSQL 16, Lombok
  - Katmanlar: `controller` → `service` (interface) → `service/impl` → `repository`; `dto/`, `model/`, `exception/` (`ObsException` + `ErrorCode` + `GlobalExceptionHandler`)
  - Roller: `STUDENT`, `ACADEMICIAN`, `ADMINISTRATIVE` (personel), `ADMIN`. Kullanıcı kalıtımı `JOINED` (users + students/academicians/administratives)
- `frontend/`: React 19 + Vite 8 + Tailwind v4, ortak bileşenler `src/components/ui`, API çağrıları `src/services`
- `docker-compose.yml`: sadece PostgreSQL (port 55050)

## Komutlar

- Veritabanı: `docker compose up -d db`
- Backend test: `cd backend && ./gradlew test` (Testcontainers eklendikten sonra Docker Desktop açık olmalı)
- Backend çalıştır: `cd backend && ./gradlew bootRun`
- Frontend: `cd frontend && npm install && npm run dev` (lint: `npm run lint`, build: `npm run build`)

## Dev hesapları (seed, şifre hepsi `password123`)

`admin` (Admin) · `personel01` (Staff) · `hocam01` (Academician) · `2024001` (Student)

## Mevcut durum (31 Ekim 2026)

- Aktif branch `frontend-modernize`: frontend baştan tasarlandı, 4 commit, merge edilmedi.
- Commit edilmemiş yerel değişiklikler (Berat'ın): `backend/build.gradle` (Lombok satırları), `application.properties` (`ddl-auto=create`, `sql.init.mode=always`), takip edilmeyen `backend/src/main/resources/data.sql` (seed), silinmiş `test_data_seeder.sql`.
- Sistem analizi ve sıralı iş planı: `docs/HARDENING_PLAN.md`. İşler oradaki alt faz numaralarıyla (0.1, 1.2 …) yürür.

## Çalışma kuralları

- Her alt faz: önce başarısız test, sonra düzeltme, `./gradlew test` yeşil, sonra tek commit (`fix(security): …`, `feat(grading): …`).
- Minimal, hedefli değişiklik; plan dışında büyük refactor yok. Yol üstünde görülen yeni sorun `docs/HARDENING_PLAN.md` sonuna not olarak eklenir.
- K1–K6 kararları (plan dokümanı) verilmeden Faz 2 ve 3'e başlama; Berat'a sor.
- Push ve `main`'e merge sadece Berat isteyince.
- macOS komutları kullan (Windows değil).
