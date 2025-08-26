-- READ ONLY Database Validation Tests for Preregistro System
-- These queries verify database structure and data integrity without making changes

-- Test 1: Verify audit tables exist and are properly structured
SELECT 'Test 1: Checking preregistro_logs table structure' as test_name;
SELECT 
    COUNT(*) as table_exists,
    'preregistro_logs table' as description
FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'preregistro_logs';

SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
    AND table_name = 'preregistro_logs'
ORDER BY ORDINAL_POSITION;

-- Test 2: Verify CI sequence table exists and has proper structure
SELECT 'Test 2: Checking ci_sequence table structure' as test_name;
SELECT 
    COUNT(*) as table_exists,
    'ci_sequence table' as description
FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'ci_sequence';

SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE,
    COLUMN_DEFAULT,
    EXTRA
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
    AND table_name = 'ci_sequence'
ORDER BY ORDINAL_POSITION;

-- Test 3: Check CI sequence current state (READ ONLY)
SELECT 'Test 3: CI sequence current state' as test_name;
SELECT 
    COALESCE(MAX(id), 0) as current_max_ci,
    COUNT(*) as total_sequences,
    MIN(created_at) as first_sequence,
    MAX(created_at) as last_sequence
FROM ci_sequence;

-- Test 4: Verify trigger exists for CI generation
SELECT 'Test 4: Checking CI generation trigger' as test_name;
SELECT 
    TRIGGER_NAME,
    EVENT_MANIPULATION,
    ACTION_TIMING,
    ACTION_STATEMENT
FROM information_schema.triggers 
WHERE TRIGGER_SCHEMA = DATABASE() 
    AND TRIGGER_NAME LIKE '%ci%';

-- Test 5: Check existing Drupal node structure (packages)
SELECT 'Test 5: Checking existing package nodes' as test_name;
SELECT 
    COUNT(*) as total_nodes,
    COUNT(CASE WHEN vid = 1 THEN 1 END) as prealertado_count,
    COUNT(CASE WHEN vid = 3 THEN 1 END) as vuelo_asignado_count,
    COUNT(CASE WHEN field_ci_paquete_value IS NOT NULL THEN 1 END) as nodes_with_ci
FROM node n
LEFT JOIN node__field_ci_paquete ci ON n.nid = ci.entity_id
WHERE n.type = 'paquete'
LIMIT 10;

-- Test 6: Check field mappings for packages
SELECT 'Test 6: Checking field mappings structure' as test_name;
SELECT 
    t.name as table_name,
    COUNT(*) as field_count
FROM information_schema.tables t
WHERE t.table_schema = DATABASE() 
    AND t.table_name LIKE 'node__field_%'
    AND t.table_name IN (
        'node__field_tracking',
        'node__field_peso', 
        'node__field_contenido',
        'node__field_numero_de_tarima',
        'node__field_ci_paquete'
    )
GROUP BY t.name;

-- Test 7: Sample existing tracking numbers (for search testing)
SELECT 'Test 7: Sample tracking numbers for testing' as test_name;
SELECT 
    ft.field_tracking_value as tracking_number,
    n.nid,
    n.vid,
    CASE 
        WHEN n.vid = 1 THEN 'Prealertado'
        WHEN n.vid = 3 THEN 'Vuelo Asignado'
        ELSE CONCAT('Status ID: ', n.vid)
    END as status,
    ci.field_ci_paquete_value as ci_number
FROM node n
INNER JOIN node__field_tracking ft ON n.nid = ft.entity_id
LEFT JOIN node__field_ci_paquete ci ON n.nid = ci.entity_id
WHERE n.type = 'paquete'
    AND ft.field_tracking_value IS NOT NULL
    AND ft.field_tracking_value != ''
ORDER BY n.changed DESC
LIMIT 5;

-- Test 8: Check casilleros/clients data
SELECT 'Test 8: Sample casilleros/clients for dropdown' as test_name;
SELECT 
    fn.field_nombre_value as client_name,
    fn.entity_id as user_id,
    COUNT(*) as package_count
FROM user__field_nombre fn
INNER JOIN node n ON CAST(fn.field_nombre_value AS CHAR) = CAST(n.uid AS CHAR)
WHERE n.type = 'paquete'
    AND fn.field_nombre_value IS NOT NULL
GROUP BY fn.field_nombre_value, fn.entity_id
ORDER BY package_count DESC
LIMIT 10;

-- Test 9: Verify taxonomy terms for status (READ ONLY)
SELECT 'Test 9: Checking status taxonomy terms' as test_name;
SELECT 
    td.tid,
    td.name,
    td.vid as vocabulary_id,
    COUNT(n.nid) as packages_with_status
FROM taxonomy_term_data td
LEFT JOIN node n ON n.vid = td.tid
WHERE td.vid IN (1, 3) -- Prealertado and Vuelo Asignado
    AND n.type = 'paquete'
GROUP BY td.tid, td.name, td.vid
ORDER BY td.tid;

-- Test 10: Database performance check for search queries
SELECT 'Test 10: Performance check for tracking search' as test_name;
EXPLAIN SELECT 
    n.nid,
    ft.field_tracking_value,
    fp.field_peso_value,
    fc.field_contenido_value
FROM node n
INNER JOIN node__field_tracking ft ON n.nid = ft.entity_id
LEFT JOIN node__field_peso fp ON n.nid = fp.entity_id  
LEFT JOIN node__field_contenido fc ON n.nid = fc.entity_id
WHERE n.type = 'paquete'
    AND ft.field_tracking_value LIKE '%TEST%'
    AND n.vid IN (1, 3)
LIMIT 10;

-- Test 11: Verify error logging table structure
SELECT 'Test 11: Checking preregistro_errors table' as test_name;
SELECT 
    COUNT(*) as table_exists,
    'preregistro_errors table' as description
FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'preregistro_errors';

-- Test 12: Recent processing activity (if any exists)
SELECT 'Test 12: Recent processing activity check' as test_name;
SELECT 
    COUNT(*) as total_logs,
    COUNT(CASE WHEN DATE(completed_at) = CURDATE() THEN 1 END) as today_logs,
    AVG(processing_time_seconds) as avg_processing_time,
    MAX(completed_at) as last_activity
FROM preregistro_logs
WHERE completed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY);

-- Test 13: Bulk Status Update - Validate Status System
SELECT 'Test 13: Bulk Status Update - Status System Validation' as test_name;
SELECT 
    t.tid as status_id,
    t.name as status_name,
    t.vid as vocabulary_id,
    COUNT(fst.entity_id) as packages_with_status
FROM taxonomy_term_field_data t
LEFT JOIN node__field_estado fst ON fst.field_estado_target_id = t.tid AND fst.deleted = 0
LEFT JOIN node_field_data n ON n.nid = fst.entity_id AND n.type = 'paquete' AND n.status = 1
WHERE t.vid = 'estados'
    AND t.name IN ('Prealertado', 'Vuelo Asignado', 'En Aduana', 'Recibido en Miami', 'Listo para entregar', 'Entregado')
GROUP BY t.tid, t.name, t.vid
ORDER BY t.tid;

-- Test 14: Bulk Status Update - Find Test Candidates
SELECT 'Test 14: Bulk Status Update - Test Candidate Packages' as test_name;
SELECT 
    n.nid,
    ft.field_tracking_value as tracking,
    ttd.name as current_status,
    ttd.tid as current_status_id,
    fn.field_nombre_value as client_name,
    FROM_UNIXTIME(n.created, '%Y-%m-%d %H:%i:%s') as created_date
FROM node_field_data n
LEFT JOIN node__field_tracking ft ON ft.entity_id = n.nid AND ft.deleted = 0
LEFT JOIN node__field_estado fst ON fst.entity_id = n.nid AND fst.deleted = 0
LEFT JOIN taxonomy_term_field_data ttd ON ttd.tid = fst.field_estado_target_id
LEFT JOIN users_field_data ufd ON ufd.uid = n.uid
LEFT JOIN user__field_nombre fn ON fn.entity_id = ufd.uid AND fn.deleted = 0
WHERE n.status = 1 
    AND n.type = 'paquete'
    AND ttd.name = 'Vuelo Asignado' -- Only packages eligible for status update
    AND n.created >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 30 DAY)) -- Recent packages
ORDER BY n.created DESC
LIMIT 10;

-- Test 15: Bulk Status Update - Verify Table Structure
SELECT 'Test 15: Bulk Status Update - node__field_estado Table Structure' as test_name;
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE,
    COLUMN_KEY,
    EXTRA
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
    AND table_name = 'node__field_estado'
ORDER BY ORDINAL_POSITION;

-- Test 16: Bulk Status Update - Check Indexes for Performance
SELECT 'Test 16: Bulk Status Update - Performance Indexes Check' as test_name;
SELECT 
    INDEX_NAME,
    COLUMN_NAME,
    SEQ_IN_INDEX,
    NON_UNIQUE
FROM information_schema.statistics 
WHERE table_schema = DATABASE() 
    AND table_name = 'node__field_estado'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

-- Test 17: Bulk Status Update - Simulate Query Performance
SELECT 'Test 17: Bulk Status Update - Query Performance Analysis' as test_name;
EXPLAIN SELECT 
    n.nid,
    ft.field_tracking_value,
    ttd.name as current_status,
    fst.field_estado_target_id
FROM node_field_data n
LEFT JOIN node__field_tracking ft ON ft.entity_id = n.nid AND ft.deleted = 0
LEFT JOIN node__field_estado fst ON fst.entity_id = n.nid AND fst.deleted = 0
LEFT JOIN taxonomy_term_field_data ttd ON ttd.tid = fst.field_estado_target_id
WHERE n.nid IN (539068, 539067, 539065, 539064, 539063)
    AND n.status = 1
    AND n.type = 'paquete';

-- Test 18: Bulk Status Update - Status Transition Validation
SELECT 'Test 18: Bulk Status Update - Status Transition Logic' as test_name;
SELECT 
    'From: Vuelo Asignado (ID: 3) -> To: En Aduana (ID: 4)' as transition_rule,
    COUNT(CASE WHEN ttd.tid = 3 THEN 1 END) as vuelo_asignado_count,
    COUNT(CASE WHEN ttd.tid = 4 THEN 1 END) as en_aduana_count,
    CASE 
        WHEN COUNT(CASE WHEN ttd.tid = 3 THEN 1 END) > 0 
        THEN 'READY: Packages found for testing'
        ELSE 'WARNING: No packages with Vuelo Asignado status found'
    END as test_readiness
FROM node_field_data n
LEFT JOIN node__field_estado fst ON fst.entity_id = n.nid AND fst.deleted = 0
LEFT JOIN taxonomy_term_field_data ttd ON ttd.tid = fst.field_estado_target_id
WHERE n.status = 1 AND n.type = 'paquete';

-- Test 19: Bulk Status Update - Data Integrity Checks
SELECT 'Test 19: Bulk Status Update - Data Integrity Validation' as test_name;
SELECT 
    'Checking for orphaned status records' as check_type,
    COUNT(*) as orphaned_records
FROM node__field_estado fst
LEFT JOIN node_field_data n ON n.nid = fst.entity_id
WHERE n.nid IS NULL AND fst.deleted = 0;

SELECT 
    'Checking for packages without status' as check_type,
    COUNT(*) as packages_without_status
FROM node_field_data n
LEFT JOIN node__field_estado fst ON fst.entity_id = n.nid AND fst.deleted = 0
WHERE n.status = 1 
    AND n.type = 'paquete'
    AND fst.field_estado_target_id IS NULL;

-- Test 20: Bulk Status Update - Mock Update Query (READ ONLY)
SELECT 'Test 20: Bulk Status Update - Mock Update Analysis' as test_name;
SELECT 
    'This shows what would be updated in a bulk operation' as description,
    n.nid as package_nid,
    ft.field_tracking_value as tracking_number,
    ttd.name as current_status,
    fst.field_estado_target_id as current_status_id,
    'En Aduana' as target_status,
    4 as target_status_id,
    'Would update: field_estado_target_id = 4' as mock_update_action
FROM node_field_data n
INNER JOIN node__field_tracking ft ON ft.entity_id = n.nid AND ft.deleted = 0
INNER JOIN node__field_estado fst ON fst.entity_id = n.nid AND fst.deleted = 0
INNER JOIN taxonomy_term_field_data ttd ON ttd.tid = fst.field_estado_target_id
WHERE n.status = 1 
    AND n.type = 'paquete'
    AND fst.field_estado_target_id = 3  -- Only Vuelo Asignado
    AND n.created >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 30 DAY))
LIMIT 5;

-- Test 21: Bulk Status Update - API Testing Data
SELECT 'Test 21: Bulk Status Update - API Test Data Generation' as test_name;
SELECT 
    JSON_OBJECT(
        'packageNids', JSON_ARRAY_APPEND(JSON_ARRAY(), '$', n.nid),
        'trackingNumber', ft.field_tracking_value,
        'currentStatus', ttd.name,
        'targetStatusId', 4,
        'targetStatusName', 'En Aduana'
    ) as api_test_payload
FROM node_field_data n
INNER JOIN node__field_tracking ft ON ft.entity_id = n.nid AND ft.deleted = 0
INNER JOIN node__field_estado fst ON fst.entity_id = n.nid AND fst.deleted = 0
INNER JOIN taxonomy_term_field_data ttd ON ttd.tid = fst.field_estado_target_id
WHERE n.status = 1 
    AND n.type = 'paquete'
    AND fst.field_estado_target_id = 3  -- Only Vuelo Asignado
LIMIT 3;

-- Summary Report
SELECT 'SUMMARY: Database validation complete' as test_name;
SELECT 
    'All core tables verified for preregistro system + bulk status update' as summary,
    NOW() as validation_timestamp;

-- Show database and connection info
SELECT 
    DATABASE() as current_database,
    USER() as current_user,
    @@version as mysql_version,
    @@sql_mode as sql_mode;