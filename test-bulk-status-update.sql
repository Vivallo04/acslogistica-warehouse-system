-- Bulk Status Update Feature Testing Script
-- This script validates the bulk status update functionality for Recibidor de Miami
-- Tests the transition from "Vuelo Asignado" (ID: 3) to "En Aduana" (ID: 4)

-- ============================================================================
-- SECTION 1: SETUP AND VALIDATION
-- ============================================================================

-- Show current database info
SELECT 'BULK STATUS UPDATE TESTING SCRIPT' as script_name;

SELECT 
    DATABASE() as current_database,
    USER() as current_user,
    NOW() as test_start_time;

-- Validate status taxonomy exists and is correct
SELECT 'Status Taxonomy Validation' as test_section;
SELECT 
    t.tid as status_id,
    t.name as status_name,
    t.description__value as description,
    COUNT(fst.entity_id) as packages_count
FROM taxonomy_term_field_data t
LEFT JOIN node__field_estado fst ON fst.field_estado_target_id = t.tid AND fst.deleted = 0
LEFT JOIN node_field_data n ON n.nid = fst.entity_id AND n.type = 'paquete' AND n.status = 1
WHERE t.vid = 'estados'
    AND t.name IN ('Vuelo Asignado', 'En Aduana')
GROUP BY t.tid, t.name, t.description__value
ORDER BY t.tid;

-- ============================================================================
-- SECTION 2: FIND TEST CANDIDATES
-- ============================================================================

-- Find packages with "Vuelo Asignado" status that can be updated
SELECT 'Test Candidate Packages (Vuelo Asignado -> En Aduana)' as test_section;
SELECT 
    n.nid,
    ft.field_tracking_value as tracking_number,
    ttd.name as current_status,
    ttd.tid as current_status_id,
    fn.field_nombre_value as client_name,
    ftar.field_tarima_value as tarima_number,
    FROM_UNIXTIME(n.created, '%Y-%m-%d %H:%i:%s') as created_date,
    FROM_UNIXTIME(n.changed, '%Y-%m-%d %H:%i:%s') as last_modified
FROM node_field_data n
INNER JOIN node__field_tracking ft ON ft.entity_id = n.nid AND ft.deleted = 0
INNER JOIN node__field_estado fst ON fst.entity_id = n.nid AND fst.deleted = 0
INNER JOIN taxonomy_term_field_data ttd ON ttd.tid = fst.field_estado_target_id
LEFT JOIN users_field_data ufd ON ufd.uid = n.uid
LEFT JOIN user__field_nombre fn ON fn.entity_id = ufd.uid AND fn.deleted = 0
LEFT JOIN node__field_tarima ftar ON ftar.entity_id = n.nid AND ftar.deleted = 0
WHERE n.status = 1 
    AND n.type = 'paquete'
    AND fst.field_estado_target_id = 3  -- Vuelo Asignado
    AND n.created >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 60 DAY)) -- Recent packages
ORDER BY n.created DESC
LIMIT 10;

-- ============================================================================
-- SECTION 3: DATABASE STRUCTURE VALIDATION
-- ============================================================================

-- Verify node__field_estado table structure
SELECT 'node__field_estado Table Structure' as test_section;
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE,
    COLUMN_KEY,
    COLUMN_DEFAULT,
    EXTRA
FROM information_schema.columns 
WHERE table_schema = DATABASE() 
    AND table_name = 'node__field_estado'
ORDER BY ORDINAL_POSITION;

-- Check indexes for optimal update performance
SELECT 'Performance Indexes for Updates' as test_section;
SELECT 
    INDEX_NAME,
    COLUMN_NAME,
    NON_UNIQUE,
    CARDINALITY
FROM information_schema.statistics 
WHERE table_schema = DATABASE() 
    AND table_name = 'node__field_estado'
    AND COLUMN_NAME IN ('entity_id', 'field_estado_target_id')
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

-- ============================================================================
-- SECTION 4: SIMULATE BULK UPDATE QUERIES
-- ============================================================================

-- Mock bulk update query analysis (READ ONLY)
SELECT 'Mock Bulk Update Query Analysis' as test_section;
SELECT 
    'SIMULATION: What would be updated' as operation_type,
    n.nid as package_nid,
    ft.field_tracking_value as tracking_number,
    ttd.name as current_status,
    fst.field_estado_target_id as current_status_id,
    'En Aduana' as target_status,
    4 as target_status_id,
    CONCAT('UPDATE node__field_estado SET field_estado_target_id = 4 WHERE entity_id = ', n.nid, ' AND field_estado_target_id = 3') as mock_update_query
FROM node_field_data n
INNER JOIN node__field_tracking ft ON ft.entity_id = n.nid AND ft.deleted = 0
INNER JOIN node__field_estado fst ON fst.entity_id = n.nid AND fst.deleted = 0
INNER JOIN taxonomy_term_field_data ttd ON ttd.tid = fst.field_estado_target_id
WHERE n.status = 1 
    AND n.type = 'paquete'
    AND fst.field_estado_target_id = 3  -- Only Vuelo Asignado
    AND n.created >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 30 DAY))
ORDER BY n.nid
LIMIT 5;

-- Performance analysis for the bulk update query
SELECT 'Bulk Update Query Performance Analysis' as test_section;
EXPLAIN SELECT 
    n.nid,
    ft.field_tracking_value,
    ttd.name as current_status,
    fst.field_estado_target_id
FROM node_field_data n
LEFT JOIN node__field_tracking ft ON ft.entity_id = n.nid AND ft.deleted = 0
LEFT JOIN node__field_estado fst ON fst.entity_id = n.nid AND fst.deleted = 0
LEFT JOIN taxonomy_term_field_data ttd ON ttd.tid = fst.field_estado_target_id
WHERE n.nid IN (
    SELECT n2.nid 
    FROM node_field_data n2
    INNER JOIN node__field_estado fst2 ON fst2.entity_id = n2.nid AND fst2.deleted = 0
    WHERE n2.status = 1 
        AND n2.type = 'paquete'
        AND fst2.field_estado_target_id = 3
    LIMIT 5
)
    AND n.status = 1
    AND n.type = 'paquete';

-- ============================================================================
-- SECTION 5: DATA INTEGRITY CHECKS
-- ============================================================================

-- Check for data integrity issues
SELECT 'Data Integrity Validation' as test_section;

-- Check for orphaned estado records
SELECT 
    'Orphaned estado records (no matching package)' as check_type,
    COUNT(*) as count
FROM node__field_estado fst
LEFT JOIN node_field_data n ON n.nid = fst.entity_id AND n.type = 'paquete' AND n.status = 1
WHERE fst.deleted = 0 AND n.nid IS NULL;

-- Check for packages without estado
SELECT 
    'Packages without estado field' as check_type,
    COUNT(*) as count
FROM node_field_data n
LEFT JOIN node__field_estado fst ON fst.entity_id = n.nid AND fst.deleted = 0
WHERE n.status = 1 
    AND n.type = 'paquete'
    AND fst.field_estado_target_id IS NULL;

-- Check for invalid status IDs
SELECT 
    'Invalid status IDs (not in taxonomy)' as check_type,
    COUNT(*) as count
FROM node__field_estado fst
LEFT JOIN taxonomy_term_field_data ttd ON ttd.tid = fst.field_estado_target_id
WHERE fst.deleted = 0 AND ttd.tid IS NULL;

-- ============================================================================
-- SECTION 6: API TESTING DATA GENERATION
-- ============================================================================

-- Generate API test payloads for different scenarios
SELECT 'API Test Data Generation' as test_section;

-- Single package update payload
SELECT 
    'Single Package Update' as test_case,
    CONCAT('{',
        '"packageNids":[', n.nid, '],',
        '"targetStatusId":4,',
        '"targetStatusName":"En Aduana",',
        '"userId":1,',
        '"testData":{',
            '"nid":', n.nid, ',',
            '"tracking":"', IFNULL(ft.field_tracking_value, ''), '",',
            '"currentStatus":"', IFNULL(ttd.name, ''), '",',
            '"currentStatusId":', IFNULL(ttd.tid, 0),
        '}',
    '}') as api_payload
FROM node_field_data n
INNER JOIN node__field_tracking ft ON ft.entity_id = n.nid AND ft.deleted = 0
INNER JOIN node__field_estado fst ON fst.entity_id = n.nid AND fst.deleted = 0
INNER JOIN taxonomy_term_field_data ttd ON ttd.tid = fst.field_estado_target_id
WHERE n.status = 1 
    AND n.type = 'paquete'
    AND fst.field_estado_target_id = 3  -- Only Vuelo Asignado
ORDER BY n.created DESC
LIMIT 1;

-- Multiple packages update payload
SELECT 
    'Multiple Packages Update' as test_case,
    CONCAT('[',
        GROUP_CONCAT(n.nid SEPARATOR ','),
    ']') as package_nids_array,
    CONCAT('{',
        '"packageNids":[', GROUP_CONCAT(n.nid SEPARATOR ','), '],',
        '"targetStatusId":4,',
        '"targetStatusName":"En Aduana",',
        '"userId":1,',
        '"expectedUpdates":', COUNT(*),
    '}') as bulk_api_payload
FROM node_field_data n
INNER JOIN node__field_estado fst ON fst.entity_id = n.nid AND fst.deleted = 0
WHERE n.status = 1 
    AND n.type = 'paquete'
    AND fst.field_estado_target_id = 3  -- Only Vuelo Asignado
    AND n.created >= UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 30 DAY))
LIMIT 3;

-- ============================================================================
-- SECTION 7: EDGE CASE TESTING
-- ============================================================================

-- Test edge cases and error scenarios
SELECT 'Edge Cases and Error Scenarios' as test_section;

-- Packages with wrong status (should not be updated)
SELECT 
    'Packages with wrong status (should fail)' as edge_case,
    n.nid,
    ft.field_tracking_value as tracking,
    ttd.name as current_status,
    ttd.tid as current_status_id,
    'Should be rejected by API' as expected_result
FROM node_field_data n
INNER JOIN node__field_tracking ft ON ft.entity_id = n.nid AND ft.deleted = 0
INNER JOIN node__field_estado fst ON fst.entity_id = n.nid AND fst.deleted = 0
INNER JOIN taxonomy_term_field_data ttd ON ttd.tid = fst.field_estado_target_id
WHERE n.status = 1 
    AND n.type = 'paquete'
    AND fst.field_estado_target_id != 3  -- NOT Vuelo Asignado
    AND ttd.name IN ('Prealertado', 'En Aduana', 'Entregado')
ORDER BY ttd.tid
LIMIT 5;

-- Non-existent package IDs (should fail)
SELECT 
    'Non-existent package IDs (should fail)' as edge_case,
    999999 as fake_nid,
    'Should return package not found error' as expected_result;

-- ============================================================================
-- SECTION 8: CONCURRENT UPDATE TESTING SCENARIOS
-- ============================================================================

-- Identify packages that could be used for concurrent update testing
SELECT 'Concurrent Update Test Candidates' as test_section;
SELECT 
    n.nid,
    ft.field_tracking_value as tracking,
    'Vuelo Asignado' as current_status,
    3 as current_status_id,
    'Use for testing concurrent updates to same packages' as test_purpose
FROM node_field_data n
INNER JOIN node__field_tracking ft ON ft.entity_id = n.nid AND ft.deleted = 0
INNER JOIN node__field_estado fst ON fst.entity_id = n.nid AND fst.deleted = 0
WHERE n.status = 1 
    AND n.type = 'paquete'
    AND fst.field_estado_target_id = 3  -- Only Vuelo Asignado
ORDER BY n.created DESC
LIMIT 3;

-- ============================================================================
-- SECTION 9: FINAL SUMMARY
-- ============================================================================

-- Summary report
SELECT 'BULK STATUS UPDATE TEST SUMMARY' as final_section;
SELECT 
    COUNT(CASE WHEN fst.field_estado_target_id = 3 THEN 1 END) as packages_ready_for_update,
    COUNT(CASE WHEN fst.field_estado_target_id = 4 THEN 1 END) as packages_already_en_aduana,
    COUNT(*) as total_packages_analyzed,
    CASE 
        WHEN COUNT(CASE WHEN fst.field_estado_target_id = 3 THEN 1 END) > 0 
        THEN '✅ READY FOR TESTING'
        ELSE '⚠️  NO TEST DATA AVAILABLE'
    END as test_readiness_status,
    NOW() as test_completed_at
FROM node_field_data n
LEFT JOIN node__field_estado fst ON fst.entity_id = n.nid AND fst.deleted = 0
WHERE n.status = 1 AND n.type = 'paquete';

-- API endpoints to test
SELECT 'API Endpoints Ready for Testing' as info_section;
SELECT 
    'PUT http://localhost:5001/api/Packages/bulk-update-status' as endpoint_url,
    'Content-Type: application/json' as headers,
    'Use the generated JSON payloads above for testing' as instructions;

-- Testing checklist
SELECT 'Testing Checklist' as checklist_section;
SELECT 
    '1. ✅ Database structure validated' as step_1,
    '2. ✅ Test data identified' as step_2,
    '3. ✅ API payloads generated' as step_3,
    '4. ⏳ Run backend API tests' as step_4,
    '5. ⏳ Test frontend integration' as step_5,
    '6. ⏳ Test error scenarios' as step_6,
    '7. ⏳ Test concurrent updates' as step_7;