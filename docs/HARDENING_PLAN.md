# OBS Sistem Analizi ve Güçlendirme Planı

31 Ekim 2026. Canlı ve güncel sürüm: https://claude.ai/artifact/Q8RcgZHtJfF9YmDT9omfrg (bu dosya o dokümanın repodaki kopyasıdır).

## Özet: en kritik 5 bulgu

1. **Herkes herkesin to-do'sunu silebiliyor:** `TodoServiceImpl` update/delete/toggle'da kayıt sahibini kontrol etmiyor.
2. **Personel admini silebiliyor:** `ADMINISTRATIVE` tüm `/api/admin/**` uçlarında admin ile aynı yetkide; `deleteUser` hedefin rolüne bakmıyor.
3. **İlk sınav notuyla öğrenci FF alıyor:** `AcademicianServiceImpl.updateEnrollmentScore` harf notunu her not girişinde, eksik sınavlarla hesaplıyor (vize 90 × %40 = 36 → FF).
4. **GPA hiç güncellenmiyor:** kodda `setGpa` yok; dashboard, danışman ekranı ve risk etiketi seed değerini, transkript farklı bir değeri gösteriyor.
5. **Testler dev veritabanını siliyor:** test profili yok; testler `ddl-auto=create` ile ana veritabanında çalışıyor.

## Bulgular

### Güvenlik ve yetkilendirme

| Öncelik | Bulgu | Nerede |
| --- | --- | --- |
| Kritik | To-do sahiplik kontrolü yok | `TodoServiceImpl.updateTodo/deleteTodo/toggleTodo` |
| Kritik | Personel = admin yetkisi | `/api/admin/**` controller'ları `hasAnyRole('ADMIN','ADMINISTRATIVE')` |
| Kritik | `deleteUser` hedef rolü ve kendini kontrol etmiyor | `AdminServiceImpl.deleteUser` |
| Yüksek | Pasif kullanıcının token'ı çalışıyor | `AuthTokenFilter` `isEnabled()` bakmıyor |
| Yüksek | JWT secret'ın kodda varsayılanı var | `JwtUtils` `@Value` |
| Yüksek | Genel hata handler istisna mesajını dönüyor, loglamıyor | `GlobalExceptionHandler` |
| Orta | Sahiplik kontrolü olmayan uçlar | `getTodayAttendance`, `getCourseSchedule`, `getCourseAnnouncements` |
| Orta | Herkes her mesajı okundu yapabiliyor | `MessagingServiceImpl.markAsRead` |
| Orta | Login rate limit yok | `/api/auth/login` |
| Orta | `/h2-console` açık, frame koruması kapalı | `SecurityConfig` |
| Düşük | `@CrossOrigin("*")` global CORS'u eziyor | `AuthController`, `MessagingController` |
| Düşük | İki mesajlaşma API'si | `ChatController`, `MessagingController` |

Akademisyen servisindeki ders sahipliği kontrolleri (sınav, not, yoklama kaydı, analitik, export) doğru; testle korunmalı.

### İş kuralları

| Öncelik | Bulgu | Nerede |
| --- | --- | --- |
| Kritik | Harf notu eksik sınavlarla hesaplanıyor | `updateEnrollmentScore` |
| Kritik | Dönem içi FF sonraki kayıtta zorunlu tekrar sayılıyor | `RegistrationServiceImpl.validateMandatoryCourses` |
| Kritik | `Student.gpa` güncellenmiyor | — |
| Yüksek | Tekrar alınan ders GNO'da iki kez sayılıyor | `TranscriptServiceImpl.getTranscript` |
| Yüksek | Kontenjan (`Course.quota`) kontrol edilmiyor | `RegistrationServiceImpl` |
| Yüksek | Kayıt dönemi tarihleri kontrol edilmiyor | `Semester.registrationStart/EndDate` |
| Yüksek | Açılmamış (`open=false`) dersler kayda açık | `getAvailableCourses` |
| Yüksek | Toplu kayıt mükerrer kaydı engellemiyor | `enrollCourses` |
| Orta | Tekli kayıt başka bölümü kabul ediyor, zorunlu ders kontrolünü atlıyor | `registerCourse` |
| Orta | Geçilmiş derse tekrar kayıt engellenmiyor | kayıt servisi |
| Orta | Puan aralığı ve ağırlık toplamı girişte kontrol edilmiyor | `enterGrades`, `createExam` |
| Orta | Notlu sınav silinince ders notu yeniden hesaplanmıyor | `deleteExam` |
| Bilgi | `POST /academician/courses` yok (frontend "New course" 404) | — |
| Bilgi | Duyuru listesi entity'yi lazy `Course` ile dönüyor | `getCourseAnnouncements` |

### Veri bütünlüğü

- Unique yok: `enrollments(student, course, semester)`, `grades(enrollment, exam)`, `attendance_records(enrollment, date)`.
- `@Version`/kilit yok; DTO'larda Bean Validation yok (`@Valid` sadece auth'ta).
- `CHECK` yok (puan, ağırlık); birden fazla aktif dönem olabilir; kullanıcı silmede cascade tanımsız; e-posta çakışması 500 dönüyor; harf notu `String`.

### Test, operasyon, performans

- Testler mutlu yol; kritik hataların hiçbirini yakalamıyor. `application-test.properties` yok; `DatabaseSeederTest` kırık (silinen dosyayı arıyor).
- Flyway yok (`ddl-auto`); seed her ortamda; şifreler düz metin; backend Dockerfile, CI, Actuator yok; `DiagnosticTask` her açılışta log basıyor; README koddan farklı.
- 13 `findAll().stream().filter` (12 `AdminServiceImpl`, 1 `AcademicianServiceImpl`); sayfalama yok; N+1 beklenen yerler (transkript, öğrenci listeleri); index yok; ölçüm yok.

### Frontend

- JWT `localStorage`'da, süre kontrolü yok; paket ~490 KB tek bundle; test yok; "New course" ve duyuru listesi backend bekliyor; `frontend-modernize` merge edilmedi.

## İş planı

6 faz, 27 alt faz. Her alt faz tek commit ve önce başarısız testle başlar.

### Başlamadan önce kararlar (Berat verecek)

| # | Karar | Seçenekler | Öneri | Karar |
| --- | --- | --- | --- | --- |
| K1 | Harf notu ne zaman atanır? | (a) tüm sınavlar girilince otomatik (b) hoca "notları kesinleştir" der | (b) || (b) — 11 Kasım |
| K2 | GPA saklansın mı? | (a) her istekte hesapla (b) kesinleşince hesaplayıp `Student.gpa`'ya yaz | (b), tek hesap servisi || (b) — 11 Kasım |
| K3 | Personel neleri yapabilir? | (a) admin ile aynı (b) öğrenci/akademisyen hesabı açar-günceller; admin/personel hesaplarına dokunamaz, kimseyi silemez (c) kullanıcı yönetimi tamamen admin'de | (b) | (b) — 11 Kasım |
| K4 | Kullanıcı silme | (a) kalıcı (b) pasife alma | (b) | (b) — 11 Kasım |
| K5 | Tekrar alınan derste hangi not, hangi harfler başarısız? | son / en yüksek; FF veya FF+FD | son not; harfler üniversite yönetmeliğine göre || son not; sadece FF başarısız — 11 Kasım |
| K6 | Akademisyen "New course" formu | (a) öneri ucu + admin onayı (b) formu kaldır | (b) | |

### Çalışma kuralları

- `frontend-modernize` önce `main`'e merge edilir, sonra `main`'den `hardening` açılır (Berat onaylarsa).
- Her alt faz: başarısız test → düzeltme → `./gradlew test` yeşil → commit.
- Faz sonu tüm testler yeşilse `main`'e merge (Berat onayıyla).
- Testcontainers için Docker Desktop açık olmalı.
- Plan dışı yeni sorun bu dosyanın sonuna not edilir.

### Faz 0: Zemin

**0.1 Test izolasyonu**
- [x] `build.gradle`: `org.testcontainers:postgresql`, `org.testcontainers:junit-jupiter`, `spring-boot-testcontainers`
- [x] `AbstractIntegrationTest`: singleton PostgreSQL container, `@ServiceConnection`, `@ActiveProfiles("test")`
- [x] `application-test.properties` (şimdilik `ddl-auto=create-drop`, `spring.sql.init.mode=never`)
- [x] Dört entegrasyon test sınıfı base'i extend etsin; `DatabaseSeederTest`'i kaldır
- Bitti: `./gradlew test` yerel DB kapalıyken geçiyor; dev verisi yerinde.

**0.2 Flyway ve profiller**
- [x] `flyway-core` + `flyway-database-postgresql`
- [x] Mevcut şemayı `pg_dump --schema-only` ile çıkar → `db/migration/V1__baseline.sql`
- [x] `ddl-auto=validate` (test profili de Flyway ile)
- [x] Ayarları böl: `application.properties` (ortak), `application-dev.properties`, `application-test.properties`
- [x] `data.sql` → `db/dev/R__dev_seed.sql`; sadece dev profilinde `spring.flyway.locations`'a eklenir
- Bitti: iki kez başlatınca veri kalıyor; validate hatasız; seed sadece dev'de.

**0.3 Sırlar ve gereksiz parçalar**
- [x] JWT secret, DB URL/kullanıcı/şifre env'den (`OBS_JWT_SECRET`, `OBS_DB_URL`, `OBS_DB_USER`, `OBS_DB_PASSWORD`); varsayılan yok
- [x] Secret 32 byte'tan kısaysa uygulama açılmasın
- [x] `.env.example` + Rider run configuration notu; `.env` `.gitignore`'da
- [x] Kaldır: `/h2-console` izni, frameOptions disable, H2 bağımlılığı, iki `@CrossOrigin("*")`, `DiagnosticTask`
- [x] CORS origin property'den (`obs.cors.allowed-origins`)
- Bitti: repoda şifre yok; secret yoksa uygulama açılmıyor.

**0.4 Hata yönetimi ve loglama**
- [x] Genel handler: "Beklenmeyen bir hata oluştu" + `traceId`; stack trace log'a
- [x] `DataIntegrityViolationException` → 409; `HttpMessageNotReadableException`, `MethodArgumentTypeMismatchException` → 400; `NoResourceFoundException` → 404
- [x] SLF4J: `ObsException` WARN, diğerleri ERROR; `show-sql` sadece dev
- Test: 500 yanıtında istisna mesajı yok, `traceId` var.

### Faz 1: Güvenlik açıkları

**1.1 Yetki test altyapısı**
- [x] `TestDataFactory`: fakülte, bölüm, dönem, ders, öğrenci, hoca, kayıt builder'ları
- [x] `AuthHelper`: `as(user)` ile gerçek `JwtUtils` token'ı (rol ayrımı kullanıcının kendisinden gelir)
- [ ] Mevcut testlerdeki tekrar eden kurulumu bu yardımcılara taşı
- Bitti: yeni yetki testi 5–10 satır.

**1.2 To-do sahipliği (IDOR)**
- [x] `TodoItemRepository.findByIdAndUserId`
- [x] update/delete/toggle bunu kullansın; bulunamazsa 404
- Test: B, A'nın to-do'suna PUT/DELETE/PATCH → 404, kayıt değişmemiş.

**1.3 Admin ve personel ayrımı** (K3, K4)
- [x] Kullanıcı uçlarında metot bazında `@PreAuthorize`
- [x] Personel admin/personel hesabı açamaz, güncelleyemez, şifresini değiştiremez
- [x] Silme sadece ADMIN; soft delete; kendini ve ADMIN'i pasife alamaz
- [x] Listeler aktif kullanıcıları göstersin; frontend "Delete" → "Deactivate"
- Test: personel × kullanıcı uçları matrisi; admin kendini silemez (400).

**1.4 Pasif kullanıcı ve token**
- [x] `AuthTokenFilter`: `isEnabled()` false ise auth kurma
- [x] Token süresi 24 → 8 saat (property)
- Test: pasife alınan kullanıcının token'ı 401.

**1.5 Akademisyen ve mesaj sahipliği**
- [x] `requireOwnCourse(courseId)`; `getTodayAttendance`, `getCourseSchedule`, `getCourseAnnouncements`
- [x] `markAsRead` sadece alıcı
- [x] Frontend'in kullanmadığı mesajlaşma API'sini kaldır
- Test: başka hocanın dersi 403; başkasının mesajı 404.

**1.6 Login rate limit**
- [x] Bucket4j: IP + kullanıcı adı başına 5/dk → 429 + `Retry-After`
- [x] Başarılı giriş kullanıcı kovasını sıfırlar; frontend 429 mesajı
- Test: 6. hatalı deneme 429.

### Faz 2: Not ve GPA doğruluğu (K1, K2, K5 gerekli)

**2.1 Hesaplama servisleri**
- [x] `GradingPolicy` (Strategy): puan → harf, harf → katsayı; tek tablo
- [x] `GpaCalculator`: ANO/GNO; tekrar alınan derste son kesinleşmiş not
- [x] Transkript ve simülasyon bunları kullansın; iki kopya silinsin
- Test (saf birim): 89.99 → BA, 90 → AA, 49.99 → FF; boş liste; tekrar; AKTS ağırlığı; simülasyon.

**2.2 Not kesinleştirme**
- [x] Not girişi sadece `score`'u günceller; `grade` null kalır
- [x] `POST /academician/courses/{id}/finalize-grades`: ağırlıklar %100 ve her onaylı öğrencinin her sınav notu var; yoksa eksik listesiyle 400
- [x] Başarılıysa harfler atanır, kayıtlar `FINALIZED`, bildirim, audit log
- [x] Kesinleşmiş notu değiştirme ayrı uç, gerekçe zorunlu, audit log
- [x] Frontend: "Notları kesinleştir" butonu, eksik not uyarısı; öğrencide "Devam ediyor"
- Test: sadece vize → harf null; eksikle finalize 400; tamla harfler atanır.

**2.3 GPA tek kaynaktan**
- [x] Kesinleştirme sonrası `Student.gpa` `GpaCalculator` ile güncellenir
- [x] Dashboard, danışman listesi, risk etiketi, transkript aynı değer
- [x] Seed'deki sabit GPA'lar kaldırılır
- Test: dashboard GPA = transkript GNO.

**2.4 Zorunlu tekrar kuralı**
- [x] Sadece kesinleşmiş, geçmiş dönem başarısız notları
- [x] Sonra geçilen ders listeden düşer
- Test: aktif dönem FF zorunlu değil; geçen dönem FF zorunlu; sonra geçilmişse değil.

**2.5 Sınav kuralları**
- [ ] Toplam ağırlık > %100 → 400
- [ ] Notlu sınav silinemez (409); kesinleşmiş dersin sınavı değişmez
- [ ] Puan 0–100 kontrolü
- Test: %110 → 400; notlu sınav silme 409.

### Faz 3: Kayıt kuralları ve veri bütünlüğü

**3.1 Tek kayıt yolu**
- [ ] `registerCourse` ve `enrollCourses` aynı `EnrollmentValidator` zinciri
- [ ] Kurallar: kayıt dönemi, ders açık, bölüm, zaten kayıtlı, geçilmiş, zorunlu tekrar, AKTS ≤ 30, çakışma, kontenjan
- [ ] Her kural kendi hata kodu (`REGISTRATION_CLOSED`, `QUOTA_FULL`…); frontend mesajı
- [ ] `getAvailableCourses` sadece açık dersler + kontenjan durumu
- Test: her kurala bir negatif senaryo; iki yol aynı cevap.

**3.2 Kontenjan ve eşzamanlılık**
- [ ] Ders satırı `PESSIMISTIC_WRITE`; dolu yer kilit altında sayılır
- [ ] PENDING de sayılır; red yeri boşaltır
- [ ] Frontend "12/40" doluluk
- Test: kontenjan 1, 10 eşzamanlı istek → 1 başarılı, 9 `QUOTA_FULL`.

**3.3 Veritabanı kısıtları (Flyway V2)**
- [ ] Mükerrer veri kontrolü ve temizlik
- [ ] Unique: enrollments, grades, attendance_records
- [ ] Check: score 0–100, ratio (0,100], akts > 0, quota ≥ 0
- [ ] Tek aktif dönem: partial unique index
- [ ] Index: `enrollments(student_id)`, `enrollments(course_id, semester_id, status)`, `schedules(course_id)`, `chat_messages(sender_id, receiver_id)`
- Test: repository ile mükerrer kayıt → 409.

**3.4 Optimistic locking ve validasyon**
- [ ] `@Version`: Enrollment, Grade, Course, Semester (Flyway V3)
- [ ] Optimistic lock hatası → 409
- [ ] Tüm request DTO'lara Bean Validation + `@Valid`; alan bazlı hata listesi; frontend alan altında gösterir
- [ ] Harf notu enum
- Test: geçersiz DTO 400 + alan listesi; eski versiyonla güncelleme 409.

### Faz 4: Yetki matrisi ve performans

**4.1 Erişim matrisi testi**
- [ ] `RequestMappingHandlerMapping`'den tüm uçlar; uç × (anonim, öğrenci, hoca, personel, admin) beklenen sonuç tablosu; parametreli test
- [ ] Tabloda olmayan yeni uç testi kırar
- [ ] IDOR: başka öğrencinin kaydı, başkasının sohbeti, başka hocanın sınavı

**4.2 Sorgular ve sayfalama**
- [ ] 13 `findAll().stream().filter` → repository sorguları
- [ ] Duyuru gönderimi batch insert
- [ ] Admin listeleri ve audit log'a `Pageable`; frontend sayfa geçişi

**4.3 N+1**
- [ ] Hibernate statistics ile sorgu sayısı testi
- [ ] `@EntityGraph`/fetch join: transkript, danışman listesi, ders öğrenci listesi, kayıt ekranı
- Test: 1 ve 50 kayıtlı öğrencide transkript aynı sorgu sayısı.

**4.4 Yük ölçümü**
- [ ] Büyük seed: 10.000 öğrenci, 500 ders, ~200.000 kayıt
- [ ] k6: dashboard, transkript, kayıt listesi, ders öğrenci listesi, admin kullanıcı listesi
- [ ] p50/p95 README'ye

### Faz 5: Operasyon ve vitrin

**5.1** Backend Dockerfile (Temurin 21), frontend nginx, Compose (db + backend + frontend, healthcheck), Actuator `/actuator/health`
**5.2** GitHub Actions: backend build + test, frontend lint + build, gitleaks
**5.3** Duyuru DTO'su ve listesi; K6'ya göre "New course"; `React.lazy` route bölme; Vitest (login, kayıt, not girişi)
**5.4** README'yi baştan yaz; CV maddelerini ölçülen sayılarla güncelle

### Tahmini takvim

| Oturum | Alt fazlar | Sonuç |
| --- | --- | --- |
| 1 | 0.1–0.4, 1.1–1.2 | İzole testler, Flyway, sırlar env'de, to-do açığı kapalı |
| 2 | 1.3–1.6 | Güvenlik açıkları kapalı ve testli |
| 3 | 2.1–2.5 | Not kesinleştirme, doğru GPA |
| 4 | 3.1–3.4 | Tek kayıt yolu, kontenjan, kısıtlar, eşzamanlılık testi |
| 5 | 4.1–4.4 | Erişim matrisi, sayfalama, ölçülmüş p95 |
| 6 | 5.1–5.4 | Docker, CI, README, CV |

## Yol üstünde eklenen notlar

**1. oturum (6 Kasım 2026)**: 0.1–0.4, 1.1, 1.2 `hardening` branch'inde, alt faz başına bir commit.
- Bu oturumdan Maven/Gradle'a erişilemediği için kod derlenmeden yazıldı; `./gradlew test` ilk kez Mac'te çalıştırılacak. Java dışı her şey doğrulandı: V1 şeması ve dev seed PostgreSQL 16'da çalıştı, entity alanları ile V1 kolonları otomatik karşılaştırmada birebir eşleşti (20 tablo, 0 fark), değişen dosyalarda sözdizimi hatası yok.
- 1.1'deki "mevcut testlerin kurulumunu yardımcılara taşı" maddesi bilerek ertelendi: derlemeden büyük test refactor'ü riskli. Yeni testler yardımcıları kullanıyor.
- 1.2'de sorgu `findByIdAndUserId` yerine `findByIdAndUserUsername` oldu (fazladan kullanıcı sorgusu gerekmiyor).
- 0.4'e plan dışı küçük ek: yanlış HTTP metodu artık 500 yerine 405.
- `ErrorCode.ALREADY_EXISTS` hâlâ 400 dönüyor; 409'a çekmek frontend mesajlarını etkileyebileceği için Faz 3.4'e bırakıldı.
- Kökteki `seed.sql` eski ve kullanılmıyor (şema ile uyumsuz kolonlar içeriyor olabilir); silinmesi önerilir.

**2. oturum (11 Kasım 2026)**: 1.3–1.6 `hardening` branch'inde, alt faz başına bir commit. K3 = (b), K4 = (b). Bu kod da derlenmeden yazıldı; 1. oturumla birlikte ilk `./gradlew test`'te doğrulanacak.
- 1.3: "Delete" pasife alıyor; ayrıca `PATCH /api/admin/users/{id}/reactivate` eklendi. Listeler pasif kullanıcıları gizlemek yerine "Inactive" rozetiyle gösteriyor, çünkü admin'in geri açabilmesi gerekiyor.
- 1.4: Oturumsuz isteklere artık 403 yerine 401 dönüyor. Frontend'in "401'de oturumu kapat" mantığı daha önce hiç tetiklenmiyordu. Ayrıca yanlış şifre girildiğinde login sayfasının yeniden yüklenip hata mesajını silmesi düzeltildi.
- 1.5: Analizdeki "herkes her mesajı okundu yapabiliyor" bulgusu abartılıydı: `markAsRead`'i çağıran bir HTTP ucu yoktu. Yine de servis seviyesinde sahiplik kontrolü eklendi.
- 1.6: Bucket4j yerine bağımlılıksız bir in-memory limiter yazıldı (tek instance için yeterli; ölçeklenirse Redis gerekir). IP limiti dakikada 5 değil 20, çünkü kampüs ağında birçok kullanıcı aynı IP'yi paylaşır.
