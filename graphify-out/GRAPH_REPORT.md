# Graph Report - mjys  (2026-10-22)

## Corpus Check
- 397 files · ~1,159,288 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 8 file(s) not represented in the graph (top: .csv 2, .example 1, (none) 1)

## Summary
- 3578 nodes · 5926 edges · 160 communities (120 shown, 40 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 190 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `af643c9b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Prisma Namespace Internals
- Prisma Member Model
- Prisma PendingPurchase Model
- Prisma Package Model
- Prisma ClassOccurrence Model
- Prisma Attendance Model
- Admin Pages & Banners UI
- Prisma PackageOffer Model
- Prisma MemberMilestone Model
- Prisma MemberToyPart Model
- Admin API Routes
- Prisma Instructor Model
- Prisma ToyPart Model
- Prisma Milestone Model
- ui/index.ts
- Prisma CLI Skill
- Admin Layout & Typography
- Prisma Common Input Types
- Prisma HomeBanner Model
- Prisma HomeContent Model
- Member Profile & Login
- Package Purchase Flow
- Supabase Auth & API Keys Guides
- Auth API Routes
- Home Page & Rewards
- Agent Instructions & Home Plans
- scanner/page.tsx
- Thai Calendar & Bottom Nav
- Admin Auth Routes
- bookings/route.ts
- Home Banner Upload API
- About Page Tabs
- package.json Metadata
- Prisma Browser Namespace
- Prisma Database Setup Guides
- Postgres Connection Limits
- Admin Calendar & CSV Export
- Row Level Security Plan
- Runtime Dependencies
- PrismaClient Instance API
- Classes Overhaul Plan
- Banner Cards Plan
- Paid Special-Class Cancellation
- Member Request Auth & Upload
- MVP Schedule & Home Plans
- MVP Foundation & Brand
- mock/packages.ts
- TypeScript Config
- Book Page & Class Range Cache
- Banner Storage Plan
- Staff Directory Plan
- Prisma Client Exports
- Attendance Delegate
- ClassOccurrence Delegate
- HomeBanner Delegate
- HomeContent Delegate
- Instructor Delegate
- Member Delegate
- MemberMilestone Delegate
- MemberToyPart Delegate
- Milestone Delegate
- Package Delegate
- PackageOffer Delegate
- PendingPurchase Delegate
- ToyPart Delegate
- Prisma Filters & Full-Text
- Member QR Check-in
- PHASE 3: Member Special-Class Payment Experience
- Purchases & Slip Upload Plan
- LIFF Login Auth
- Prisma Browser Exports
- Yoga Quote Cards
- Date Strip & Inline Calendar
- Dev Dependencies
- Pricing & Payment Images
- Prisma Query Options
- Package Revamp Overview
- Database Seed Script
- Tiger Sticker Sheets
- Prisma Transactions
- (shell)/layout.tsx
- line-session.ts
- Package Revamp Booking
- Temp Storage Overview
- CSV/XLSX Import-Export Plan
- Package Revamp Admin
- Server Schedule Cache Plan
- Mock Member Store
- Quote Collage & Brand Poster
- Postgres Privileges & RLS
- LINE LIFF Skill
- Prisma Client Class Runtime
- Client Preferences Cache
- Workshop & Welcome Images
- RLS Performance & Security
- XLSX Export Route
- Instructors API & About Revamp
- Card
- Package Revamp Testing
- Member Fluent Client
- Prisma Relation Queries
- Prisma Raw Queries
- Dev Member Route
- Classes Client API
- Calendar Sheet
- Party & Anniversary Stickers
- Prisma Model Queries
- Postgres Best Practices Index
- Supabase Agent Skill
- Advisory Locks & SKIP LOCKED
- Booking Migration Plan
- Package Balance Helpers
- Book Window Lazy Load
- Prisma Enums
- Attendance Fluent Client
- ClassOccurrence Fluent Client
- Package Fluent Client
- PendingPurchase Fluent Client
- Tiger Yoga Mat Renders
- Batch Inserts & N+1
- Postgres Index Types
- Root Layout
- Admin Calendar Plan
- MVP Rewards & Design Tokens
- MVP Profile & LINE Auth
- MemberMilestone Fluent Client
- MemberToyPart Fluent Client
- PackageOffer Fluent Client
- Class Intensity Levels
- Deadlocks & Short Transactions
- Postgres Data Types
- MVP Packages & PromptPay
- Package Revamp Member UI
- Instructor Fluent Client
- Milestone Fluent Client
- ToyPart Fluent Client
- npm Scripts
- Tiger Image Catalog
- Vacuum & Statistics
- Primary Key Strategy
- ESLint Config
- HomeBanner Fluent Client
- HomeContent Fluent Client
- Cursor Pagination
- Upsert Patterns
- Composite Indexes
- Covering Indexes
- Partial Indexes
- Lowercase Identifiers
- pnpm Workspace
- PostCSS Config
- Next.js File/Globe Icons
- Vercel/Window Icons
- Project README
- Table Partitioning
- Next.js Wordmark
- privacy/page.tsx
- StaffOverviewTab.tsx
- Apply Principle of Least Privilege

## God Nodes (most connected - your core abstractions)
1. `cn()` - 135 edges
2. `next` - 94 edges
3. `Card()` - 67 edges
4. `verifyAdmin()` - 63 edges
5. `lucide-react` - 61 edges
6. `react` - 60 edges
7. `Button` - 55 edges
8. `prisma` - 37 edges
9. `expireCacheTags()` - 31 edges
10. `Badge()` - 29 edges

## Surprising Connections (you probably didn't know these)
- `NEXT_PUBLIC_LIFF_ID Public vs Server-Only LINE Secrets` --semantically_similar_to--> `Never Expose service_role/Secret Key in Public Clients`  [INFERRED] [semantically similar]
  .devin/skills/line-liff/SKILL.md → .agents/skills/supabase/SKILL.md
- `GET()` --calls--> `verifyAdmin()`  [EXTRACTED]
  app/api/admin/members/affinity/route.ts → lib/admin-auth.ts
- `GET()` --calls--> `verifyAdmin()`  [EXTRACTED]
  app/api/admin/members/stats/route.ts → lib/admin-auth.ts
- `/admin/pricing PackageOffer Editor` --conceptually_related_to--> `TigerPromoCard (/api/home-banners)`  [AMBIGUOUS]
  docs/archived-plans/archive-26-08-26/admin-dashboard/04-promotions-slips.md → AGENTS.md
- `AdminBannersPage()` --calls--> `Card()`  [EXTRACTED]
  app/(admin)/admin/banners/page.tsx → components/ui/Card.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Admin Portal Phased Feature Plan** — docs_archived_plans_archive_26_08_26_admin_dashboard_00_overview_admin_portal_overview, docs_archived_plans_archive_26_08_26_admin_dashboard_01_customer_slip_upload_customer_slip_upload, docs_archived_plans_archive_26_08_26_admin_dashboard_02_auth_security_admin_auth_security, docs_archived_plans_archive_26_08_26_admin_dashboard_03_calendar_management_calendar_management, docs_archived_plans_archive_26_08_26_admin_dashboard_04_promotions_slips_slip_approvals_pricing, docs_archived_plans_archive_26_08_26_admin_dashboard_05_members_directory_members_directory, docs_archived_plans_archive_26_08_26_admin_dashboard_06_qr_on_day_scanner_qr_checkin [EXTRACTED 1.00]
- **ClassTemplate Removal Across Schema, API, Admin and Public UI** — docs_archived_plans_archive_26_08_26_classes_change_00_overview_classtemplate_removal, docs_archived_plans_archive_26_08_26_classes_change_01_schema_migration_remove_class_templates_migration, docs_archived_plans_archive_26_08_26_classes_change_02_api_refactor_template_include_removal, docs_archived_plans_archive_26_08_26_classes_change_03_admin_ui_autocomplete_class_name_autocomplete, docs_archived_plans_archive_26_08_26_classes_change_06_public_ui_updates [EXTRACTED 1.00]
- **Editable Home Banner Pipeline (Storage, CRUD, Admin UI, Home Render)** — docs_archived_plans_archive_26_08_26_editable_home_01_storage_schema_homebanner_model, docs_archived_plans_archive_26_08_26_editable_home_00_overview_banners_bucket, docs_archived_plans_archive_26_08_26_editable_home_02_backend_api_admin_home_banners_crud, docs_archived_plans_archive_26_08_26_editable_home_02_backend_api_banner_upload_endpoint, docs_archived_plans_archive_26_08_26_editable_home_03_admin_ui_admin_banners_page, docs_archived_plans_archive_26_08_26_editable_home_02_backend_api_public_home_banners_api, docs_archived_plans_archive_26_08_26_editable_home_04_home_integration_gethomebanners, docs_archived_plans_archive_26_08_26_editable_home_00_overview_tigerpromocard [EXTRACTED 1.00]
- **Mitr Journey class package tiers** — public_pricing_tiger_walk_in, public_pricing_mitr_standard, public_pricing_mitr_premium, public_pricing_journey_ultimate [EXTRACTED 1.00]
- **Lot lifecycle: FIFO spend, consumed lot tracking, same-lot refund** — docs_plans_package_revamp_00_overview_fifo_lot_spend, docs_plans_package_revamp_01_schema_and_balance_pickfifolot, docs_plans_package_revamp_01_schema_and_balance_consumedpackageid, docs_plans_package_revamp_02_booking_and_redemption_post_bookings_gate, docs_plans_package_revamp_02_booking_and_redemption_same_lot_refund, docs_plans_package_revamp_01_schema_and_balance_walk_in_by_type [EXTRACTED 1.00]
- **Prisma Database Provider Setup Guides** — _agents_skills_prisma_database_setup_references_postgresql, _agents_skills_prisma_database_setup_references_mysql, _agents_skills_prisma_database_setup_references_sqlite, _agents_skills_prisma_database_setup_references_mongodb, _agents_skills_prisma_database_setup_references_sqlserver, _agents_skills_prisma_database_setup_references_cockroachdb, _agents_skills_prisma_database_setup_references_prisma_postgres [EXTRACTED 1.00]
- **Schema sync then explicit generate and seed** — _agents_skills_prisma_cli_references_migrate_dev_prisma_migrate_dev, _agents_skills_prisma_cli_references_db_push_prisma_db_push, _agents_skills_prisma_cli_references_migrate_reset_prisma_migrate_reset, _agents_skills_prisma_cli_references_generate_prisma_generate, _agents_skills_prisma_cli_references_db_seed_prisma_db_seed, _agents_skills_prisma_cli_skill_explicit_followup_commands [EXTRACTED 1.00]
- **Public content tables with scoped SELECT policies** — docs_archived_plans_archive_26_08_26_row_level_security_02_public_content_read_policies_migration_enable_rls_public_content, docs_archived_plans_archive_26_08_26_row_level_security_02_public_content_read_policies_public_read_access_policy, docs_archived_plans_archive_26_08_26_row_level_security_00_overview_table_instructor, docs_archived_plans_archive_26_08_26_row_level_security_00_overview_table_classtemplate, docs_archived_plans_archive_26_08_26_row_level_security_00_overview_table_classoccurrence, docs_archived_plans_archive_26_08_26_row_level_security_00_overview_table_homecontent, docs_archived_plans_archive_26_08_26_row_level_security_00_overview_table_packageoffer, docs_archived_plans_archive_26_08_26_row_level_security_00_overview_table_toypart, docs_archived_plans_archive_26_08_26_row_level_security_00_overview_table_milestone [EXTRACTED 1.00]
- **Sensitive tables locked with default-deny RLS** — docs_archived_plans_archive_26_08_26_row_level_security_01_enable_rls_sensitive_tables_migration_enable_rls_sensitive_tables, docs_archived_plans_archive_26_08_26_row_level_security_00_overview_table_member, docs_archived_plans_archive_26_08_26_row_level_security_00_overview_table_attendance, docs_archived_plans_archive_26_08_26_row_level_security_00_overview_table_pendingpurchase, docs_archived_plans_archive_26_08_26_row_level_security_00_overview_table_package, docs_archived_plans_archive_26_08_26_row_level_security_00_overview_table_membertoypart, docs_archived_plans_archive_26_08_26_row_level_security_00_overview_table_membermilestone [EXTRACTED 1.00]
- **Tagged server cache with revalidation** — docs_plans_temp_storage_02_server_cache_classes_cache_tags, docs_plans_temp_storage_02_server_cache_classes_unstable_cache_classes, docs_plans_temp_storage_02_server_cache_classes_revalidate_on_admin_writes, docs_plans_temp_storage_03_server_cache_catalogs_catalog_cache, docs_plans_temp_storage_04_admin_calendar_and_stats_admin_calendar_cache [EXTRACTED 1.00]
- **Attendance Gamification Loop (QR Check-in, Levels, Tiger Toys, Milestones)** — docs_archived_plans_archive_26_08_26_mvp_02_profile_auth_member_qr_pass, docs_archived_plans_archive_26_08_26_mvp_05_rewards_history_polish_check_in_api, docs_archived_plans_archive_26_08_26_mvp_02_profile_auth_level_system, docs_archived_plans_archive_26_08_26_mvp_05_rewards_history_polish_tiger_toys, docs_archived_plans_archive_26_08_26_mvp_05_rewards_history_polish_milestones, docs_archived_plans_archive_26_08_26_mvp_05_rewards_history_polish_rewards_lib [INFERRED 0.85]
- **Mitr Journey brand and promotional image assets** — public_mitr_logo_mitr_journey_logo, public_mitr_welcome_welcome_banner, public_2026_0628_workshop_kruex_line_workshop_inversion_poster, public_mitr_logo_mitr_journey_yoga_studio [INFERRED 0.85]
- **Mitr Journey Weekly Quote Card Series (tiger mascot + yoga quote + brand footer)** — public_quote2_image, public_quote3_image, public_quote4_image, public_quote5_image, public_quote6_image, public_quote2_mitr_journey_brand, public_quote2_tiger_mascot_figurine [INFERRED 0.85]
- **Paid special-class entitlement enforcement flow** — docs_archived_plans_archive_26_08_26_special_class_01_schema_and_migration_purchasekind_enum, docs_archived_plans_archive_26_08_26_special_class_02_api_and_booking_enforcement_api_purchases, docs_archived_plans_archive_26_08_26_special_class_02_api_and_booking_enforcement_special_booking_transaction_branch, docs_archived_plans_archive_26_08_26_refund_special_class_01_schema_and_db_paid_special_booking_classification, docs_archived_plans_archive_26_08_26_refund_special_class_03_admin_refund_management_delete_api_bookings, docs_archived_plans_archive_26_08_26_refund_special_class_02_member_refund_flow_paidspecialclasscontactmodal [INFERRED 0.85]
- **PrismaClient configuration and extension surface** — _agents_skills_prisma_client_api_references_constructor_prismaclient_constructor, _agents_skills_prisma_client_api_references_constructor_adapter_option, _agents_skills_prisma_client_api_references_constructor_log_option, _agents_skills_prisma_client_api_references_client_methods_on, _agents_skills_prisma_client_api_references_client_methods_extends, _agents_skills_prisma_client_api_references_constructor_accelerate_url, _agents_skills_prisma_client_api_references_constructor_comments_sqlcommenter [INFERRED 0.85]
- **Prisma Migrate lifecycle commands** — _agents_skills_prisma_cli_references_migrate_dev_prisma_migrate_dev, _agents_skills_prisma_cli_references_migrate_deploy_prisma_migrate_deploy, _agents_skills_prisma_cli_references_migrate_status_prisma_migrate_status, _agents_skills_prisma_cli_references_migrate_resolve_prisma_migrate_resolve, _agents_skills_prisma_cli_references_migrate_reset_prisma_migrate_reset, _agents_skills_prisma_cli_references_migrate_diff_prisma_migrate_diff, _agents_skills_prisma_cli_references_migrate_deploy_prisma_migrations_table [INFERRED 0.85]
- **Prisma SQL Driver Adapter Family** — _agents_skills_prisma_database_setup_references_postgresql_adapter_pg, _agents_skills_prisma_database_setup_references_mysql_adapter_mariadb, _agents_skills_prisma_database_setup_references_sqlite_adapter_better_sqlite3, _agents_skills_prisma_database_setup_references_sqlite_libsql_turso_adapter, _agents_skills_prisma_database_setup_references_sqlserver_adapter_mssql, _agents_skills_prisma_database_setup_references_prisma_postgres_adapter_ppg_serverless, _agents_skills_prisma_database_setup_skill_driver_adapters [INFERRED 0.85]
- **Slip Upload to Package Activation to Check-In Data Flow** — docs_archived_plans_archive_26_08_26_admin_dashboard_01_customer_slip_upload_api_upload, docs_archived_plans_archive_26_08_26_admin_dashboard_01_customer_slip_upload_pendingpurchase_proofimageurl, docs_archived_plans_archive_26_08_26_admin_dashboard_04_promotions_slips_purchase_resolve_endpoint, docs_archived_plans_archive_26_08_26_admin_dashboard_06_qr_on_day_scanner_scanner_verify_endpoint, docs_archived_plans_archive_26_08_26_admin_dashboard_06_qr_on_day_scanner_milestone_progression [INFERRED 0.85]
- **Connection management (limits, pooling, prepared statements)** — _agents_skills_supabase_postgres_best_practices_references_conn_limits_rule, _agents_skills_supabase_postgres_best_practices_references_conn_pooling_rule, _agents_skills_supabase_postgres_best_practices_references_conn_prepared_statements_rule [INFERRED 0.85]
- **Postgres index optimization strategies** — _agents_skills_supabase_postgres_best_practices_references_query_missing_indexes_rule, _agents_skills_supabase_postgres_best_practices_references_query_composite_indexes_rule, _agents_skills_supabase_postgres_best_practices_references_query_covering_indexes_rule, _agents_skills_supabase_postgres_best_practices_references_query_partial_indexes_rule, _agents_skills_supabase_postgres_best_practices_references_query_index_types_rule, _agents_skills_supabase_postgres_best_practices_references_schema_foreign_key_indexes_rule [INFERRED 0.85]
- **Lock contention and concurrency practices** — _agents_skills_supabase_postgres_best_practices_references_lock_advisory_rule, _agents_skills_supabase_postgres_best_practices_references_lock_deadlock_prevention_rule, _agents_skills_supabase_postgres_best_practices_references_lock_short_transactions_rule, _agents_skills_supabase_postgres_best_practices_references_lock_skip_locked_rule [INFERRED 0.85]
- **Supabase Postgres Rule References following template** — _agents_skills_supabase_postgres_best_practices_references__template, _agents_skills_supabase_postgres_best_practices_references_advanced_full_text_search, _agents_skills_supabase_postgres_best_practices_references_advanced_jsonb_indexing, _agents_skills_supabase_postgres_best_practices_references_conn_idle_timeout [INFERRED 0.85]
- **Supabase RLS Hardening Guidance and Application** — _agents_skills_supabase_postgres_best_practices_references_security_rls_basics_row_level_security, _agents_skills_supabase_postgres_best_practices_references_security_rls_performance_rls_performance, _agents_skills_supabase_skill_rls_in_exposed_schemas, _agents_skills_supabase_skill_security_definer_bypasses_rls, docs_archived_plans_archive_26_08_26_booking_migration_plan_rls_deny_all_policy, docs_archived_plans_archive_26_08_26_booking_migration_plan_check_rls_script [INFERRED 0.85]
- **Shell-level shared state providers** — docs_plans_temp_storage_05_optional_device_and_member_cache_memberprovider, docs_plans_temp_storage_06_shared_bookings_state_bookingsprovider, docs_plans_temp_storage_07_shared_purchases_state_purchasesprovider [INFERRED 0.85]
- **Mitr Journey tiger mascot image assets** — public_quotes_quote_cards_collage, public_tigers_line_album_tiger_260719_1_daily_routine_sticker_sheet, public_tigers_line_album_tiger_260719_10_brand_poster, public_tigers_line_album_tiger_260719_11_waving_tiger, public_tigers_line_album_tiger_260719_12_tiger_with_yoga_mat [INFERRED 0.85]
- **Tiger Mascot Yoga Mat Pose Set (transparent-background 3D renders)** — public_tigers_line_album_tiger_260719_13, public_tigers_line_album_tiger_260719_14, public_tigers_line_album_tiger_260719_15, public_tigers_line_album_tiger_260719_16 [INFERRED 0.85]
- **Mitr Journey Tiger Mascot Asset Family (stickers, signage, parking poster)** — public_tigers_line_album_tiger_260719_2, public_tigers_line_album_tiger_260719_3, public_tigers_line_album_tiger_260719_4, public_tigers_line_album_tiger_260719_5, public_tigers_line_album_tiger_260719_6, public_tigers_line_album_tiger_260719_3_mitr_journey_tiger_mascot [INFERRED 0.95]
- **LINE Album Tiger Mascot Sticker Sheets (260719)** — public_tigers_line_album_tiger_260719_7, public_tigers_line_album_tiger_260719_8, public_tigers_line_album_tiger_260719_9, public_tigers_line_album_tiger_260719_7_tiger_mascot [INFERRED 0.95]

## Communities (160 total, 40 thin omitted)

### Community 0 - "Prisma Namespace Internals"
Cohesion: 0.01
Nodes (137): AnyNull, Args, At, AtLeast, AtLoose, AtStrict, AttendanceScalarFieldEnum, BatchPayload (+129 more)

### Community 1 - "Prisma Member Model"
Cohesion: 0.02
Nodes (128): AggregateMember, BoolFieldUpdateOperationsInput, DateTimeFieldUpdateOperationsInput, EnumLevelFieldUpdateOperationsInput, EnumLevelNullableListFilter, GetMemberAggregateType, GetMemberGroupByPayload, IntFieldUpdateOperationsInput (+120 more)

### Community 2 - "Prisma PendingPurchase Model"
Cohesion: 0.02
Nodes (113): AggregatePendingPurchase, EnumPurchaseKindFieldUpdateOperationsInput, EnumPurchaseStatusFieldUpdateOperationsInput, GetPendingPurchaseAggregateType, GetPendingPurchaseGroupByPayload, PendingPurchase$classOccurrenceArgs, PendingPurchase$offerArgs, PendingPurchaseAggregateArgs (+105 more)

### Community 3 - "Prisma Package Model"
Cohesion: 0.02
Nodes (110): AggregatePackage, EnumPackageStatusFieldUpdateOperationsInput, GetPackageAggregateType, GetPackageGroupByPayload, Package$consumedAttendancesArgs, PackageAggregateArgs, PackageAvgAggregateInputType, PackageAvgAggregateOutputType (+102 more)

### Community 4 - "Prisma ClassOccurrence Model"
Cohesion: 0.02
Nodes (107): AggregateClassOccurrence, ClassOccurrence$attendancesArgs, ClassOccurrence$specialPurchasesArgs, ClassOccurrenceAggregateArgs, ClassOccurrenceAvgAggregateInputType, ClassOccurrenceAvgAggregateOutputType, ClassOccurrenceAvgOrderByAggregateInput, ClassOccurrenceCountAggregateInputType (+99 more)

### Community 5 - "Prisma Attendance Model"
Cohesion: 0.02
Nodes (106): AggregateAttendance, Attendance$consumedPackageArgs, AttendanceAggregateArgs, AttendanceCountAggregateInputType, AttendanceCountAggregateOutputType, AttendanceCountArgs, AttendanceCountOrderByAggregateInput, AttendanceCreateArgs (+98 more)

### Community 6 - "Admin Pages & Banners UI"
Cohesion: 0.05
Nodes (55): AdminBannersPage(), handleCropConfirm(), getCroppedImg(), HomeBanner, AdminCalendarPage(), Instructor, Occurrence, RosterItem (+47 more)

### Community 7 - "Prisma PackageOffer Model"
Cohesion: 0.02
Nodes (92): AggregatePackageOffer, EnumPackageTypeFieldUpdateOperationsInput, GetPackageOfferAggregateType, GetPackageOfferGroupByPayload, PackageOffer$packagesArgs, PackageOffer$pendingPurchasesArgs, PackageOfferAggregateArgs, PackageOfferAvgAggregateInputType (+84 more)

### Community 8 - "Prisma MemberMilestone Model"
Cohesion: 0.02
Nodes (88): AggregateMemberMilestone, GetMemberMilestoneAggregateType, GetMemberMilestoneGroupByPayload, MemberMilestoneAggregateArgs, MemberMilestoneCountAggregateInputType, MemberMilestoneCountAggregateOutputType, MemberMilestoneCountArgs, MemberMilestoneCountOrderByAggregateInput (+80 more)

### Community 9 - "Prisma MemberToyPart Model"
Cohesion: 0.02
Nodes (88): AggregateMemberToyPart, GetMemberToyPartAggregateType, GetMemberToyPartGroupByPayload, MemberToyPartAggregateArgs, MemberToyPartCountAggregateInputType, MemberToyPartCountAggregateOutputType, MemberToyPartCountArgs, MemberToyPartCountOrderByAggregateInput (+80 more)

### Community 10 - "Admin API Routes"
Cohesion: 0.08
Nodes (47): dynamic, GET(), DELETE(), dynamic, PATCH(), dynamic, INTENSITIES, POST() (+39 more)

### Community 11 - "Prisma Instructor Model"
Cohesion: 0.03
Nodes (77): AggregateInstructor, GetInstructorAggregateType, GetInstructorGroupByPayload, Instructor$occurrencesArgs, InstructorAggregateArgs, InstructorAvgAggregateInputType, InstructorAvgAggregateOutputType, InstructorAvgOrderByAggregateInput (+69 more)

### Community 12 - "Prisma ToyPart Model"
Cohesion: 0.03
Nodes (76): AggregateToyPart, GetToyPartAggregateType, GetToyPartGroupByPayload, ToyPart$memberPartsArgs, ToyPartAggregateArgs, ToyPartAvgAggregateInputType, ToyPartAvgAggregateOutputType, ToyPartAvgOrderByAggregateInput (+68 more)

### Community 13 - "Prisma Milestone Model"
Cohesion: 0.03
Nodes (70): AggregateMilestone, GetMilestoneAggregateType, GetMilestoneGroupByPayload, Milestone$memberMilestonesArgs, MilestoneAggregateArgs, MilestoneCountAggregateInputType, MilestoneCountAggregateOutputType, MilestoneCountArgs (+62 more)

### Community 14 - "ui/index.ts"
Cohesion: 0.05
Nodes (45): AdminStaffPage(), TabType, buildQrPayload(), PayPageProps, SpecialClassPayPage(), handleSubmit(), uploadSlip(), StaffOverviewTab() (+37 more)

### Community 15 - "Prisma CLI Skill"
Cohesion: 0.06
Nodes (58): Pipe migrate diff --script into db execute --stdin, prisma db execute, MongoDB schema inference by sampling, prisma db pull (introspection), --accept-data-loss / --force-reset, MongoDB db push workflow, prisma db push, prisma db seed (+50 more)

### Community 16 - "Admin Layout & Typography"
Cohesion: 0.07
Nodes (41): AdminLayout(), InstructorCard(), InstructorGrid(), InstructorSkeleton(), ContactShortcut(), ContactShortcutProps, HeroCard(), HeroCardProps (+33 more)

### Community 17 - "Prisma Common Input Types"
Cohesion: 0.03
Nodes (61): BoolFilter, BoolWithAggregatesFilter, DateTimeFilter, DateTimeNullableFilter, DateTimeNullableWithAggregatesFilter, DateTimeWithAggregatesFilter, EnumAttendanceStatusFilter, EnumAttendanceStatusWithAggregatesFilter (+53 more)

### Community 18 - "Prisma HomeBanner Model"
Cohesion: 0.03
Nodes (58): AggregateHomeBanner, GetHomeBannerAggregateType, GetHomeBannerGroupByPayload, HomeBannerAggregateArgs, HomeBannerAvgAggregateInputType, HomeBannerAvgAggregateOutputType, HomeBannerAvgOrderByAggregateInput, HomeBannerCountAggregateInputType (+50 more)

### Community 19 - "Prisma HomeContent Model"
Cohesion: 0.04
Nodes (52): AggregateHomeContent, GetHomeContentAggregateType, GetHomeContentGroupByPayload, HomeContentAggregateArgs, HomeContentCountAggregateInputType, HomeContentCountAggregateOutputType, HomeContentCountArgs, HomeContentCountOrderByAggregateInput (+44 more)

### Community 20 - "Member Profile & Login"
Cohesion: 0.08
Nodes (40): MyClassesPage(), CELEBRATION_MESSAGES, ProfilePage(), TopBar(), CelebrationToast(), CelebrationToastProps, ClassCountSlider(), ClassCountSliderProps (+32 more)

### Community 21 - "Package Purchase Flow"
Cohesion: 0.08
Nodes (37): buildStubQrPayload(), PayPage(), PayPageProps, PromotionPage(), RemainingClassesStrip(), RemainingClassesStripProps, PackageCard(), PackageCardProps (+29 more)

### Community 22 - "Supabase Auth & API Keys Guides"
Cohesion: 0.08
Nodes (32): Supabase Password-based Auth Guide, /auth/confirm Token Exchange Endpoint, Email Templates with TokenHash, Mailpit local email capture, Redirect URLs configuration, supabase.auth.resetPasswordForEmail(), supabase.auth.signUp(), supabase.auth.updateUser() (password change, currentPassword) (+24 more)

### Community 23 - "Auth API Routes"
Cohesion: 0.15
Nodes (24): ForgotPasswordSchema, POST(), LoginSchema, POST(), POST(), ResendSchema, POST(), ResetPasswordSchema (+16 more)

### Community 24 - "Home Page & Rewards"
Cohesion: 0.13
Nodes (27): containerVariants, HomePage(), itemVariants, CollectionPage(), TigerHeader(), MilestoneCard(), MilestoneCardProps, MilestoneCelebrationCard() (+19 more)

### Community 25 - "Agent Instructions & Home Plans"
Cohesion: 0.08
Nodes (31): AGENTS.md Agent Instructions, Home Page Assets Conventions, Home Page Rendering Order, MilestoneCelebrationCard, TigerPromoCard (/api/home-banners), WorkshopPromo (auto-hiding time-bound promo), Admin Portal Overview (MiTR Journey Yoga Studio), Purchase -> Slip Review -> On-Day Check-In Workflow (+23 more)

### Community 26 - "scanner/page.tsx"
Cohesion: 0.33
Nodes (6): AdminScannerPage(), CameraDevice, CheckInResponse, Member, playErrorBeep(), playSuccessBeep()

### Community 27 - "Thai Calendar & Bottom Nav"
Cohesion: 0.12
Nodes (25): ThaiCalendarCard(), ThaiCalendarCardProps, app/(shell)/page.tsx home page, Sawasdee, [Name]! greeting fallback, Thai festival calendar windows (UTC+7, 3-day grace), ThaiCalendarCard, ThaiFestival interface, Tiger asset mapping (public/tigers) (+17 more)

### Community 28 - "Admin Auth Routes"
Cohesion: 0.08
Nodes (22): dynamic, dynamic, GET(), ClassTimeAffinity, dynamic, GET(), InstructorAffinity, MemberAffinity (+14 more)

### Community 29 - "bookings/route.ts"
Cohesion: 0.16
Nodes (19): DELETE(), dynamic, PATCH(), checkRateLimit(), DELETE(), dynamic, GET(), jsonAuthError() (+11 more)

### Community 30 - "Home Banner Upload API"
Cohesion: 0.10
Nodes (28): ALLOWED_TYPES, dynamic, POST(), DELETE(), dynamic, GET(), PATCH(), dynamic (+20 more)

### Community 31 - "About Page Tabs"
Cohesion: 0.15
Nodes (20): AboutPage(), AboutTab, AboutTabs(), AboutTabsProps, TabDef, TABS, ContactForm(), MapEmbed() (+12 more)

### Community 32 - "package.json Metadata"
Cohesion: 0.07
Nodes (26): name, prisma, seed, private, version, clsx, dotenv, html5-qrcode (+18 more)

### Community 33 - "Prisma Browser Namespace"
Cohesion: 0.07
Nodes (25): AnyNull, AttendanceScalarFieldEnum, ClassOccurrenceScalarFieldEnum, DbNull, Decimal, HomeBannerScalarFieldEnum, HomeContentScalarFieldEnum, InstructorScalarFieldEnum (+17 more)

### Community 34 - "Prisma Database Setup Guides"
Cohesion: 0.14
Nodes (24): CockroachDB Setup, MySQL Setup, @prisma/adapter-mariadb (PrismaMariaDb), PlanetScale relationMode = prisma, MariaDB useTextProtocol option, PostgreSQL Setup, @prisma/adapter-pg (PrismaPg), PostgreSQL connection string format (+16 more)

### Community 35 - "Postgres Connection Limits"
Cohesion: 0.10
Nodes (25): max_connections setting, pg_stat_activity, Set Appropriate Connection Limits, work_mem setting, PgBouncer, Pool size formula (CPU cores * 2 + spindle_count), Use Connection Pooling for All Applications, Session pool mode (+17 more)

### Community 36 - "Admin Calendar & CSV Export"
Cohesion: 0.14
Nodes (16): dynamic, GET(), CSV_HEADER, dynamic, escapeCsv(), GET(), dynamic, GET() (+8 more)

### Community 37 - "Row Level Security Plan"
Cohesion: 0.13
Nodes (26): Dual LINE / standalone auth model, lib/db.ts Prisma client (postgres role), lib/standalone-auth.ts (mjys_sid signed cookie), FEATURE: Row Level Security Hardening, docs/guides/supabase-rls.md, Supabase Security Advisor (RLS Disabled in Public lint), Attendance (Prisma model / table), RLS table classification (sensitive vs public read) (+18 more)

### Community 38 - "Runtime Dependencies"
Cohesion: 0.08
Nodes (25): dependencies, clsx, date-fns, date-fns-tz, exceljs, html5-qrcode, jose, @line/liff (+17 more)

### Community 40 - "Classes Overhaul Plan"
Cohesion: 0.14
Nodes (19): Classes System Overhaul Overview, Inline ClassOccurrence Metadata Fields, Phase 1: Schema Migration (Remove ClassTemplate), lib/mock/schedule.ts Template Removal, remove_class_templates Migration (Backfill SQL), Phase 2: API Refactor (Remove Template References), Remove include template From API Routes, Phase 3: Admin UI Autocomplete (+11 more)

### Community 41 - "Banner Cards Plan"
Cohesion: 0.12
Nodes (19): Internal and External Banner Links, sortOrder and isActive Banner Controls, TigerPromoCard, Phase 1: Banner Storage Config & Data Model, HomeBanner Prisma Model, GET /api/home-banners (Public), centerCropToBlob, Phase 4: Home Page Banner Integration (+11 more)

### Community 42 - "Paid Special-Class Cancellation"
Cohesion: 0.16
Nodes (14): /contact Contact Us page, FEATURE: Paid Special-Class Cancellation & Refund Contact, PHASE 1: Booking Classification & Data Access, Paid special-class booking classification, PAID_SPECIAL_CANCELLATION_CONTACT_STUDIO error code, ClassCard component, PHASE 2: Member Cancellation Contact Flow, PaidSpecialClassContactModal (+6 more)

### Community 43 - "Member Request Auth & Upload"
Cohesion: 0.15
Nodes (17): DELETE(), dynamic, GET(), POST(), ALLOWED_TYPES, dynamic, POST(), authenticateRequest() (+9 more)

### Community 44 - "MVP Schedule & Home Plans"
Cohesion: 0.12
Nodes (19): InlineCalendar Component, Short-lived Signed Member QR Pass, MVP Phase 3: Class Schedule, Detail & Booking, DateStrip & CalendarSheet, MVP Phase 4: Home, Promotions & Contact, Contact Page, Attendance Check-in API, MilestoneCelebrationCard (+11 more)

### Community 45 - "MVP Foundation & Brand"
Cohesion: 0.14
Nodes (18): MVP Phase 1: Foundation (Design System, Shell, LIFF), LIFF-safe App Shell, LiffProvider / useLiff, UI Primitive Library, Cat/Tiger/Leopard Level System, MiTR Journey Brand Guideline, Breath Hero Gradient, Hand-drawn Warm Line Art (+10 more)

### Community 46 - "mock/packages.ts"
Cohesion: 0.33
Nodes (3): PACKAGE_OFFERS, PackageOffer, PackageType

### Community 47 - "TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 48 - "Book Page & Class Range Cache"
Cohesion: 0.24
Nodes (15): BookPage(), useBookings(), classMonthKey(), classMonthRange(), classNavigationRange(), ClassRange, defaultClassMonthKeys(), defaultClassRange() (+7 more)

### Community 49 - "Banner Storage Plan"
Cohesion: 0.16
Nodes (17): Editable Home Banner Cards Overview, Supabase banners Bucket (Public), Staff Directory Precedent, extractBannerPath, getBannerPublicUrl, Phase 2: Banner Backend API, Admin Home Banners CRUD API, POST /api/admin/home-banners/upload (+9 more)

### Community 50 - "Staff Directory Plan"
Cohesion: 0.14
Nodes (20): ClassOccurrence (Prisma model / table), Instructor (Prisma model / table), slips Supabase Storage bucket, FEATURE: Admin Staff Directory, GET /api/instructors, /instructors/[slug] detail page, InstructorGrid (/about page), verifyAdmin (lib/admin-auth.ts) (+12 more)

### Community 51 - "Prisma Client Exports"
Cohesion: 0.11
Nodes (14): Attendance, ClassOccurrence, $Enums, HomeBanner, HomeContent, Instructor, Member, MemberMilestone (+6 more)

### Community 65 - "Prisma Filters & Full-Text"
Cohesion: 0.16
Nodes (16): Filter Conditions and Operators, Array Field Filters (has/hasSome/hasEvery/isEmpty), Prisma Full-Text Search (@@fulltext search), JSON Path Filters, Logical Operators (AND/OR/NOT), String Filters (contains/startsWith/endsWith, mode insensitive), Advanced Features (advanced) section, Postgres Rule Reference Template (+8 more)

### Community 66 - "Member QR Check-in"
Cohesion: 0.15
Nodes (15): AdminDashboardPage(), dynamic, dynamic, POST(), dynamic, GET(), studioToday(), newlyCrossedThresholds() (+7 more)

### Community 67 - "PHASE 3: Member Special-Class Payment Experience"
Cohesion: 0.25
Nodes (7): lib/supabase.ts service-role Supabase client, app/api/upload/route.ts (POST /api/upload), /book/[occurrenceId]/pay payment route, PHASE 3: Member Special-Class Payment Experience, OccurrenceView type, Special-class state & CTA matrix, Single THB price formatter

### Community 68 - "Purchases & Slip Upload Plan"
Cohesion: 0.16
Nodes (17): PendingPurchase (Prisma model / table), PendingPurchase.proofImageUrl, FEATURE: Separate Paid Special-Class Admission, Member slip-upload and staff approval workflow, PurchaseKind enum (PACKAGE, SPECIAL_CLASS), PHASE 1: Schema & Migration (special class), ClassOccurrence.specialPriceTHB, /api/admin/purchases (+9 more)

### Community 69 - "LIFF Login Auth"
Cohesion: 0.27
Nodes (11): CALLBACK_PARAMS, getFreshIdToken(), getLiffLoginRedirectUri(), startLiffLogin(), startServerSession(), initLiff(), LiffContext, LiffContextValue (+3 more)

### Community 70 - "Prisma Browser Exports"
Cohesion: 0.13
Nodes (14): Attendance, ClassOccurrence, $Enums, HomeBanner, HomeContent, Instructor, Member, MemberMilestone (+6 more)

### Community 71 - "Yoga Quote Cards"
Cohesion: 0.20
Nodes (15): Quote: In yoga and in travel, getting lost is often how we find the most beautiful places (Anonymous), quote2.jpg - Handstand Tiger Quote Card, Mitr Journey Brand, Orange Tiger Mascot Figurine (yoga poses), Yoga as Journey / Travel Theme, Quote: Yoga is a dance between control and surrender, between pushing and letting go, quote3.jpg - Dancer Pose Tiger Quote Card, Joel Kramer (+7 more)

### Community 72 - "Date Strip & Inline Calendar"
Cohesion: 0.25
Nodes (9): DateStrip(), DateStripProps, InlineCalendar(), InlineCalendarProps, WEEKDAYS, formatDayNumber(), formatTimeShort(), formatWeekday() (+1 more)

### Community 73 - "Dev Dependencies"
Cohesion: 0.14
Nodes (14): devDependencies, dotenv, eslint, eslint-config-next, prisma, tailwindcss, @tailwindcss/postcss, tsx (+6 more)

### Community 74 - "Pricing & Payment Images"
Cohesion: 0.19
Nodes (14): payment.JPG (PromptPay/Thai QR payment code), Payment QR Code (Thai QR Payment logo center), pricing.jpg (Mitr Journey package price chart), Journey Ultimate package (20 classes, 8,000 THB, 2 months), Mitr Journey Yoga Studio (brand), Mitr Premium package (10 classes, 4,500 THB, 1 month), Mitr Standard package (5 classes, 2,500 THB, 2 weeks), Tiger Mascot (Mitr Journey yoga tiger figurine) (+6 more)

### Community 75 - "Prisma Query Options"
Cohesion: 0.17
Nodes (11): Query Options, distinct Option, include Option (filtered/nested), omit Option, orderBy Option (relation sort, nulls handling), select Option, take/skip Offset Pagination, Include Relations (filtered/nested) (+3 more)

### Community 76 - "Package Revamp Overview"
Cohesion: 0.21
Nodes (11): Package Revamp Overview, Package as dated lot of remaining classes, PackageOffer catalog (5/10/20/walk-in), PendingPurchase slip/grant ledger, Purchases stack (add a new lot), Special classes as separate paid admission, "N classes left" headline copy, Live paths (bookings, occurrence detail, remaining classes, QR) (+3 more)

### Community 77 - "Database Seed Script"
Cohesion: 0.15
Nodes (9): PrismaClient, adapter, CLASS_DATA, INSTRUCTORS, PACKAGE_OFFERS, pool, prisma, pg (+1 more)

### Community 78 - "Tiger Sticker Sheets"
Cohesion: 0.18
Nodes (13): Tiger Daily Routine Sticker Sheet, Daily Routine Activities (wake up, brush teeth, shower, dress, breakfast, watering, cooking, cleaning, washing dishes), Mitr Journey Yoga Studio: Party Time! Sticker Sheet, Celebration Stickers (Happy Anniversary, Yoga Party!, congrats, cheers, Party on!, Thai 'celebrate'), Mitr Journey Tiger Mascot (3D orange tabby tiger character), Tiger Thai-Language Chat Sticker Sheet, Thai Chat Expressions (hello, awesome, thank you, love, sad, sulking, really?, bye, coming, on my way, arrived, can't anymore, chill, let's eat, so fun), Yoga Class Journey Stickers (on my way with mat, arrived, meditating on mat) (+5 more)

### Community 79 - "Prisma Transactions"
Cohesion: 0.18
Nodes (10): findUnique/findFirst/findMany (+OrThrow), Transactions, Isolation Levels (ReadUncommitted..Serializable), Sequential (Array) Transactions, Transaction Options (maxWait/timeout/isolationLevel), MongoDB Setup, db push instead of migrate (no migrations), Mapped _id ObjectId field requirement (+2 more)

### Community 80 - "(shell)/layout.tsx"
Cohesion: 0.10
Nodes (26): isMemberOnly(), MEMBER_ONLY_ROUTES, ShellLayout(), ShellLayoutContent(), SignInGate(), BottomNav(), BottomNavSpacer(), ImageNavItem (+18 more)

### Community 81 - "line-session.ts"
Cohesion: 0.15
Nodes (17): dynamic, dynamic, POST(), dynamic, POST(), clearLineSessionCookie(), COOKIE_OPTIONS, createLineSessionToken() (+9 more)

### Community 82 - "Package Revamp Booking"
Cohesion: 0.20
Nodes (10): Booking requires remaining classes > 0, Attendance.consumedPackageId, Walk-in identified by PackageType.WALK_IN, Package Revamp Phase 2: Booking Gate, FIFO Spend, Same-Lot Refund, Admin class cancel restore (app/api/admin/classes/[id]), Check-in does not change remaining (deduct on book), Legacy null consumedPackageId FIFO restore fallback, NO_REMAINING_CLASSES error copy (+2 more)

### Community 83 - "Temp Storage Overview"
Cohesion: 0.23
Nodes (12): Temp Storage Overview: Shared Schedule Cache and Smaller Book Fetches, Upstash Redis kept for rate limits only, Temp Storage Phase 5: Optional Device and Member Cache, Clear mjys:* keys on logout/reset, Namespaced device schedule snapshot (mjys:v1), MemberProvider (single useMember), Temp Storage Phase 6: Shared Bookings State, BookingsProvider (shell-level bookings state) (+4 more)

### Community 84 - "CSV/XLSX Import-Export Plan"
Cohesion: 0.18
Nodes (11): Month-level CSV Import/Export, XLSX Export for Social Media, Phase 4: CSV Export/Import, GET /api/admin/export/csv, POST /api/admin/import/csv, papaparse, Standardized Schedule CSV Format, Phase 5: XLSX Export (+3 more)

### Community 85 - "Package Revamp Admin"
Cohesion: 0.25
Nodes (9): Package Revamp Phase 4: Admin Surfaces, Dashboard tile: members with remaining > 0, Grant / bulk grant adds a new dated lot, Member stats use expiresAt + remaining, MembersDirectoryTab remaining-classes UI, PATCH /api/admin/members/[id]/remaining, Per-lot remaining/expiry editor, Temp Storage Phase 4: Admin Calendar and Stats (+1 more)

### Community 86 - "Server Schedule Cache Plan"
Cohesion: 0.24
Nodes (10): Temp Storage Phase 2: Server Cache for Classes and Instructors, lib/cache/tags.ts (CLASSES, INSTRUCTORS), Cache key [classes, fromIso, toIso], Expire CLASSES after booking/cancel, revalidateTag on admin class/staff writes, unstable_cache for /api/classes and /api/instructors (180s), Temp Storage Phase 3: Server Cache for Catalogs, package-offers / home-banners tagged cache (+2 more)

### Community 87 - "Mock Member Store"
Cohesion: 0.43
Nodes (7): getServerSnapshot(), newId(), readSnapshot(), subscribe(), useMockMember(), UseMockMemberResult, writeSnapshot()

### Community 88 - "Quote Collage & Brand Poster"
Cohesion: 0.22
Nodes (11): Quote: The longest journey of any person is the journey inward (Dag Hammarskjold), Quote: In yoga and in travel, getting lost is often how we find the most beautiful places (Anonymous), Quote: Yoga is a dance between control and surrender (Joel Kramer), Mitr Journey Yoga Quote Cards Collage, Quote: Yoga tells us we can travel the entire universe without leaving our mat (Anonymous), Mitr Journey Yoga Studio Brand Poster (tigers on moss), Mitr Journey Yoga Studio (brand), Orange Tiger Mascot Character (+3 more)

### Community 89 - "Postgres Privileges & RLS"
Cohesion: 0.40
Nodes (4): Policy TO authenticated USING user_id = auth.uid(), FORCE ROW LEVEL SECURITY for Table Owners, Enable Row Level Security for Multi-Tenant Data, TO authenticated Alone Is Authentication Without Authorization (BOLA/IDOR)

### Community 90 - "LINE LIFF Skill"
Cohesion: 0.27
Nodes (6): getLiffId() Per-Environment LIFF IDs (LINE MINI App), initLiff() Singleton Helper, LIFF Next.js Debugging Checklist, LiffProvider / useLiff Context, LINE LIFF / LINE MINI App Skill for Next.js, LIFF Login and Profile Pattern

### Community 91 - "Prisma Client Class Runtime"
Cohesion: 0.20
Nodes (5): config, decodeBase64AsWasm(), LogOptions, PrismaClientConstructor, @prisma/client

### Community 92 - "Client Preferences Cache"
Cohesion: 0.36
Nodes (8): AdminCalendarPreferences, BookPreferences, isReasonableDate(), readAdminCalendarPreferences(), readBookPreferences(), readSessionValue(), writeAdminCalendarPreferences(), writeSessionValue()

### Community 93 - "Workshop & Welcome Images"
Cohesion: 0.24
Nodes (10): Inversion Workshop (Sun 28 Jun 2026, 9.00-12.00, 1500 THB, Mitr Journey Ratachada 32), Kru Bo (Workshop Contact, Tel 0956866966), Kru EX (Workshop Instructor), Workshop Learning Outcomes (Inversion Technique, Strength, Balance & Control, Confidence), Workshop Inversion Kru EX Promo Poster, Mitr Journey Yoga Studio Logo, Mitr Journey Yoga Studio (Brand), Tagline: Discover the strength and soul within your everyday journey (+2 more)

### Community 94 - "RLS Performance & Security"
Cohesion: 0.25
Nodes (4): private.is_team_member SECURITY DEFINER Helper, Optimize RLS Policies for Performance, Supabase Security Checklist, Views Bypass RLS (use security_invoker)

### Community 95 - "XLSX Export Route"
Cohesion: 0.25
Nodes (6): BRAND, dynamic, GET(), HEADERS, intensityColors(), exceljs

### Community 96 - "Instructors API & About Revamp"
Cohesion: 0.50
Nodes (5): Client About Page Revamp Plan, AboutTabs with Phosphor Icons, InstructorGrid Card Redesign, GET /api/instructors (Instructor[]), motion/react Hover Animations

### Community 97 - "Card"
Cohesion: 0.09
Nodes (20): AdminLoginPage(), AuthCodeErrorPage(), ForgotPasswordPage(), ForgotPasswordSchema, ResetPasswordForm(), ResetPasswordPage(), ResetPasswordSchema, ContactPage() (+12 more)

### Community 98 - "Package Revamp Testing"
Cohesion: 0.25
Nodes (8): Finite-only offers (drop UNLIMITED), Prisma package_revamp migration (non-null counts, drop UNLIMITED), Pricing form without Unlimited, Package Revamp Phase 5: Testing and Rollout, Automated coverage for helper and booking APIs, Manual member/admin/regression checklist, Preflight SQL (UNLIMITED / null counts), Rollback (prefer forward fix)

### Community 100 - "Prisma Relation Queries"
Cohesion: 0.25
Nodes (8): Relation Filters (some/every/none/is/isNot), _count Relation Count, Relation Queries, Count Relations (_count with filter), Nested Writes (create/connect/connectOrCreate), Relation Filters (some/every/none/is), Update Relations (update/updateMany/upsert/disconnect/delete/set), Nested Writes as Automatic Transactions

### Community 101 - "Prisma Raw Queries"
Cohesion: 0.29
Nodes (7): Raw Queries, BigInt Result Handling (Postgres COUNT), $executeRaw, Prisma.sql / Prisma.join / Prisma.raw helpers, $queryRaw, $queryRawUnsafe / $executeRawUnsafe, Interactive Transactions ($transaction async tx)

### Community 102 - "Dev Member Route"
Cohesion: 0.25
Nodes (6): DELETE, dynamic, GET, PATCH, POST, PUT

### Community 103 - "Classes Client API"
Cohesion: 0.43
Nodes (7): InstructorGridProps, ClassOccurrenceBase, fetchClasses(), OccurrenceView, OccurrenceWire, toOccurrenceView(), Instructor

### Community 104 - "Calendar Sheet"
Cohesion: 0.32
Nodes (6): buildMonthCells(), CalendarSheet(), CalendarSheetProps, Cell, startOfDayLocal(), WEEKDAYS

### Community 105 - "Party & Anniversary Stickers"
Cohesion: 0.32
Nodes (8): Tiger Sticker Sheet: Party On!, Party On! Tiger Sticker Set (cheers, party hats, confetti, ukulele, cake hat, selfie), Orange Tiger Mascot Character (3D chibi tiger with yoga mat), Tiger Sticker Sheet: Happy Anniversary / Mitr Journey Fun, Studio Anniversary Celebration (Happy Anniversary, Yoga Party!, congrats, Thai 'chalong' = celebrate), Mitr Journey Fun (studio brand tagline), Tiger Sticker Sheet: Welcome!, Welcome Greeting Stickers (party hat + champagne, confetti popper, dancing, ukulele)

### Community 106 - "Prisma Model Queries"
Cohesion: 0.33
Nodes (7): Model Queries (CRUD), count/aggregate/groupBy, Atomic Number Operations (increment/decrement/multiply/divide), create/createMany/createManyAndReturn, delete/deleteMany, Model Query Return Types, update/updateMany/upsert

### Community 107 - "Postgres Best Practices Index"
Cohesion: 0.33
Nodes (6): Cursor-Based Pagination, Section Definitions, Connection Management (conn) section, Data Access Patterns (data) section, Supabase Postgres Best Practices Skill, Rule Categories by Priority (8 categories)

### Community 108 - "Supabase Agent Skill"
Cohesion: 0.38
Nodes (5): Skill Feedback Issue Template, Skill Feedback Process (supabase/agent-skills GitHub issue), Supabase CLI (discover via --help), Supabase MCP Server (OAuth 2.1), Supabase Agent Skill

### Community 109 - "Advisory Locks & SKIP LOCKED"
Cohesion: 0.33
Nodes (7): pg_advisory_lock (session-level), pg_advisory_xact_lock (transaction-level), pg_try_advisory_lock (non-blocking), Use Advisory Locks for Application-Level Locking, FOR UPDATE SKIP LOCKED, Atomic claim-and-update job queue pattern, Use SKIP LOCKED for Non-Blocking Queue Processing

### Community 110 - "Booking Migration Plan"
Cohesion: 0.38
Nodes (6): /api/bookings (POST/DELETE), /api/classes Endpoint, Booking Frontend Real Data Migration + RLS Hardening, scripts/check-rls.ts RLS Audit, lib/mock/schedule.ts June-only Mock (deleted), useBookings (lib/api/bookings.ts)

### Community 111 - "Package Balance Helpers"
Cohesion: 0.57
Nodes (6): Package Revamp Phase 1: Schema and Balance Helper, lib/packages/balance.ts remaining-classes helper, getRemainingClasses / sumRemaining, pickFifoLot(lots), syncLotStatus(lot, now), usableLotsWhere(now)

### Community 112 - "Book Window Lazy Load"
Cohesion: 0.43
Nodes (7): Smaller Book fetch window instead of 2-year blob, Temp Storage Phase 1: Book Window and Lazy Load, InlineCalendar onVisibleMonthChange, Lazy month load via onVisibleMonthChange, Merge occurrences by id (Map), snappedClassWindow / snappedMonthRange helpers, STUDIO_TZ owns month boundaries

### Community 113 - "Prisma Enums"
Cohesion: 0.29
Nodes (6): AttendanceStatus, Level, PackageStatus, PackageType, PurchaseKind, PurchaseStatus

### Community 118 - "Tiger Yoga Mat Renders"
Cohesion: 0.33
Nodes (7): Tiger Mascot Handstand on Yoga Mat, Orange Tiger Yoga Mascot Character, Tiger Mascot Walking with Rolled Yoga Mat, Tiger Mascot Standing Holding Yoga Mat, Tiger Mascot Waving with Yoga Mat, Mitr Journey Tiger Mascot Logo (Open Arms), Mitr Journey Brand Wordmark

### Community 119 - "Batch Inserts & N+1"
Cohesion: 0.33
Nodes (6): COPY command, Multi-row INSERT, Batch INSERT Statements for Bulk Data, ANY($1::bigint[]) array parameter, N+1 query problem, Eliminate N+1 Queries with Batch Loading

### Community 120 - "Postgres Index Types"
Cohesion: 0.33
Nodes (6): BRIN index, B-tree index, GIN index, GiST index, Hash index, Choose the Right Index Type for Your Data

### Community 121 - "Root Layout"
Cohesion: 0.33
Nodes (3): ibmPlexSansThai, metadata, viewport

### Community 122 - "Admin Calendar Plan"
Cohesion: 0.40
Nodes (6): /api/admin/calendar and /api/admin/classes routes, Admin Studio Calendar Management Plan, ClassDetailsModal, ClassOccurrence model, ScheduleClassSheet, Admin CSV Class Import

### Community 123 - "MVP Rewards & Design Tokens"
Cohesion: 0.33
Nodes (6): data-semantic-theme Runtime Switch, MVP Phase 5: Rewards, History, Polish & Launch, Launch Checklist, Pillow Corner Radius Scale, Hot-swappable Semantic Themes (warm/earthy/bright), Design Token Cheatsheet

### Community 124 - "MVP Profile & LINE Auth"
Cohesion: 0.40
Nodes (6): MVP Phase 2: Profile, LINE Auth & Membership, Member Model, localStorage Mock Member Store, Prisma 7 Driver Adapter (PrismaPg) on Supabase, LINE ID Token Verification, Extended Registration Form with ToC

### Community 128 - "Class Intensity Levels"
Cohesion: 0.50
Nodes (4): INTENSITIES, Intensity, intensityLabel(), isIntensity()

### Community 129 - "Deadlocks & Short Transactions"
Cohesion: 0.40
Nodes (5): Consistent lock ordering (SELECT ... ORDER BY id FOR UPDATE), Deadlock detection (pg_stat_database, log_lock_waits, deadlock_timeout), Prevent Deadlocks with Consistent Lock Ordering, Keep Transactions Short to Reduce Lock Contention, statement_timeout

### Community 130 - "Postgres Data Types"
Cohesion: 0.40
Nodes (5): bigint identity primary key, numeric for money, Choose Appropriate Data Types, text over varchar(n), timestamptz

### Community 131 - "MVP Packages & PromptPay"
Cohesion: 0.50
Nodes (5): Package (Active Pass), PackageOffer, PendingPurchase Manual Approval, PromptPay QR Payment, 12h Cancellation Refund Rule

### Community 132 - "Package Revamp Member UI"
Cohesion: 0.60
Nodes (5): Package Revamp Phase 3: Member Surfaces, GET /api/purchases pooled remainingClasses, PackageAlertBanner 7-day expiry warning, RemainingClassesStrip (replaces ActivePackageStrip), usePurchases remainingClasses + nextExpiry shape

### Community 136 - "npm Scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 137 - "Tiger Image Catalog"
Cohesion: 0.70
Nodes (4): Tiger Image Contents, Individual tiger renders (11-16) and logo (17), Composed banners (parking graphic, MITR JOURNEY YOGA STUDIO), Mitr Journey Tiger Mascot

### Community 138 - "Vacuum & Statistics"
Cohesion: 0.50
Nodes (4): ANALYZE, Autovacuum scale factor tuning, pg_stat_user_tables, Maintain Table Statistics with VACUUM and ANALYZE

### Community 140 - "ESLint Config"
Cohesion: 0.50
Nodes (3): eslintConfig, eslint, eslint-config-next

### Community 143 - "Cursor Pagination"
Cohesion: 0.67
Nodes (3): Keyset (cursor) pagination, OFFSET pagination, Use Cursor-Based Pagination Instead of OFFSET

### Community 144 - "Upsert Patterns"
Cohesion: 0.67
Nodes (3): INSERT ... ON CONFLICT DO UPDATE, ON CONFLICT DO NOTHING (insert-or-ignore), Use UPSERT for Insert-or-Update Operations

### Community 157 - "privacy/page.tsx"
Cohesion: 0.24
Nodes (5): metadata, STUDIO, metadata, HOME_CONTENT, HomeContent

### Community 158 - "StaffOverviewTab.tsx"
Cohesion: 0.27
Nodes (8): MembersOverviewTab(), MembersOverviewTabProps, MembersStats, AllTimeStats, InstructorStats, StaffOverviewTabProps, CardBody(), formatMonthYear()

### Community 159 - "Apply Principle of Least Privilege"
Cohesion: 0.50
Nodes (3): Apply Principle of Least Privilege, Read-only and Writer Roles (app_readonly / app_writer), Exposing Tables to the Data API (explicit GRANT to anon/authenticated)

## Ambiguous Edges - Review These
- `Mitr Journey Fun (studio brand tagline)` → `Welcome Greeting Stickers (party hat + champagne, confetti popper, dancing, ukulele)`  [AMBIGUOUS]
  public/tigers/LINE_ALBUM_tiger_260719_9.jpg · relation: conceptually_related_to
- `TigerPromoCard (/api/home-banners)` → `/admin/pricing PackageOffer Editor`  [AMBIGUOUS]
  docs/archived-plans/archive-26-08-26/admin-dashboard/04-promotions-slips.md · relation: conceptually_related_to

## Knowledge Gaps
- **188 isolated node(s):** `react-dom`, `@tailwindcss/postcss`, `@types/node`, `@types/papaparse`, `@types/pg` (+183 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 2281 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **40 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@prisma/client` connect `Prisma Client Class Runtime` to `Prisma Namespace Internals`, `Prisma Browser Namespace`, `Prisma Member Model`, `Prisma Package Model`, `Prisma ClassOccurrence Model`, `Prisma Attendance Model`, `Prisma PendingPurchase Model`, `Prisma PackageOffer Model`, `Prisma MemberMilestone Model`, `Prisma MemberToyPart Model`, `package.json Metadata`, `Prisma Instructor Model`, `Prisma ToyPart Model`, `Prisma Milestone Model`, `Prisma Common Input Types`, `Prisma HomeBanner Model`, `Prisma Client Exports`, `Prisma HomeContent Model`?**
  _High betweenness centrality (0.307) - this node is a cross-community bridge._
- **What connects `react-dom`, `@tailwindcss/postcss`, `@types/node` to the rest of the system?**
  _188 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Prisma Namespace Internals` be split into smaller, more focused modules?**
  _Cohesion score 0.014492753623188406 - nodes in this community are weakly interconnected._
- **Why does `next` connect `Admin Auth Routes` to `Admin Pages & Banners UI`, `Admin API Routes`, `ui/index.ts`, `Admin Layout & Typography`, `Member Profile & Login`, `Package Purchase Flow`, `Auth API Routes`, `Home Page & Rewards`, `Thai Calendar & Bottom Nav`, `privacy/page.tsx`, `bookings/route.ts`, `Home Banner Upload API`, `package.json Metadata`, `Admin Calendar & CSV Export`, `Member Request Auth & Upload`, `Member QR Check-in`, `Date Strip & Inline Calendar`, `(shell)/layout.tsx`, `line-session.ts`, `XLSX Export Route`, `Card`, `Dev Member Route`, `Root Layout`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Should `Prisma Member Model` be split into smaller, more focused modules?**
  _Cohesion score 0.015503875968992248 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Mitr Journey Fun (studio brand tagline)` and `Welcome Greeting Stickers (party hat + champagne, confetti popper, dancing, ukulele)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `TigerPromoCard (/api/home-banners)` and `/admin/pricing PackageOffer Editor`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._