export const sqlQueries = {
  getProcedures: `
  SELECT p.id, p.name, p.owner_name, p.owner_phone_number, p.photo_name, p.animal_id, p.gender_id, p.race_id, p.animal_color_id, mc.id AS master_case_id, c.id AS case_id, c.created_at, COALESCE(c.is_archived, false) AS is_archived,
     p.insurance_id, c.comments, c.hospitalization_reason, c.weight_kg, c.age_years, c.age_months, to_char(c.catheter_date, 'YYYY-MM-DD') AS catheter_date, p.food_type_id, COALESCE(c.is_convenia, false) AS is_convenia, COALESCE(cn.num_of_alerts, 0) AS num_of_alerts,
     COALESCE(c.is_cerenia, false) AS is_cerenia, COALESCE(c.is_procedure, false) AS is_procedure, COALESCE(c.is_escape_potential, false) AS is_escape_potential, COALESCE(c.is_aggressive, false) AS is_aggressive, COALESCE(c.is_allergic, false) AS is_allergic,
     c.doctor_id, c.nurse_id, c.referring_doctor, p.food_type_id, c.release_date, CASE WHEN c.release_date IS NULL THEN false ELSE true END AS is_released, c.allergic_comments, COALESCE(c.is_npo, false) AS is_npo,
     COALESCE(c.is_risk_anesthesia, false) AS is_risk_anesthesia, COALESCE(c.is_heart_murmur, false) AS is_heart_murmur, COALESCE(c.is_amb, false) AS is_amb, to_char(c.procedure_date, 'YYYY-MM-DD') AS procedure_date
  FROM petec.master_case mc
  LEFT JOIN	petec.master_case_cases mcc ON mc.id = mcc.master_case_id
  LEFT JOIN petec.case c ON mcc.case_id = c.id
  LEFT JOIN petec.patient p ON c.patient_id = p.id
  LEFT JOIN petec.case_notifications cn ON cn.case_id = c.id
  WHERE COALESCE(c.is_procedure, false) = true AND ((COALESCE(cn.num_of_alerts, 0) > 0 AND $1 = true) OR ($2 = false)) AND COALESCE(c.is_archived, false) = $3 AND COALESCE(c.is_deleted, false) = false
`,
  getPatients: `
  SELECT p.id, p.name, p.owner_name, p.owner_phone_number, p.photo_name, p.animal_id, p.gender_id, p.race_id, p.animal_color_id, mc.id AS master_case_id, c.id AS case_id, c.created_at, COALESCE(c.is_archived, false) AS is_archived,
	   p.insurance_id, c.comments, c.hospitalization_reason, c.weight_kg, c.age_years, c.age_months, to_char(c.catheter_date, 'YYYY-MM-DD') AS catheter_date, p.food_type_id, COALESCE(c.is_convenia, false) AS is_convenia, COALESCE(cn.num_of_alerts, 0) AS num_of_alerts,
     COALESCE(c.is_cerenia, false) AS is_cerenia, COALESCE(c.is_procedure, false) AS is_procedure, COALESCE(c.is_escape_potential, false) AS is_escape_potential, COALESCE(c.is_aggressive, false) AS is_aggressive, COALESCE(c.is_allergic, false) AS is_allergic,
     c.doctor_id, c.nurse_id, c.referring_doctor, p.food_type_id, c.release_date, CASE WHEN c.release_date IS NULL THEN false ELSE true END AS is_released, c.allergic_comments, COALESCE(c.is_npo, false) AS is_npo,
     COALESCE(c.is_risk_anesthesia, false) AS is_risk_anesthesia, COALESCE(c.is_heart_murmur, false) AS is_heart_murmur, COALESCE(c.is_amb, false) AS is_amb, to_char(c.procedure_date, 'YYYY-MM-DD') AS procedure_date
  FROM petec.master_case mc
  LEFT JOIN	petec.master_case_cases mcc ON mc.id = mcc.master_case_id
  LEFT JOIN petec.case c ON mcc.case_id = c.id
  LEFT JOIN petec.patient p ON c.patient_id = p.id
  LEFT JOIN petec.case_notifications cn ON cn.case_id = c.id
  WHERE COALESCE(c.is_procedure, false) = false AND ((COALESCE(cn.num_of_alerts, 0) > 0 AND $1 = true) OR ($2 = false)) AND COALESCE(c.is_archived, false) = $3 AND COALESCE(c.is_deleted, false) = false
`,
  getPatientByCaseId: `
  SELECT p.id AS patient_id, p.name, p.owner_name, p.owner_phone_number, it.name AS insurance, it.id AS insurance_id, c.comments, c.hospitalization_reason, c.weight_kg, c.age_years, c.age_months, to_char(c.catheter_date, 'DD/MM/YYYY') AS catheter_date, p.photo_name,
         COALESCE(c.is_convenia, false) AS is_convenia, to_char(c.stitches_removal_date, 'DD/MM/YYYY') AS stitches_removal_date, to_char(c.next_inspection_date, 'DD/MM/YYYY') AS next_inspection_date, to_char(c.catheter_date, 'YYYY-MM-DD') AS catheter_date_for_input,
         COALESCE(c.is_cerenia, false) AS is_cerenia, COALESCE(c.is_procedure, false) AS is_procedure, COALESCE(c.is_escape_potential, false) AS is_escape_potential, COALESCE(c.is_aggressive, false) AS is_aggressive, p.race_id, c.id AS case_id,
         c.doctor_id, c.nurse_id, c.referring_doctor, p.food_type_id, to_char(c.release_date, 'DD/MM/YYYY') AS release_date, u.first_name || ' ' || u.last_name AS doctor_name, ac.name AS animal_color, ac.id AS animal_color_id, COALESCE(c.is_archived, false) AS is_archived,
         gt.name AS gender_type, gt.id AS gender_type_id, at.name AS animal_type, at.id AS animal_type_id, ft.name AS food_type, to_char(c.created_at, 'DD/MM/YYYY') AS created_at, COALESCE(c.is_allergic, false) AS is_allergic, c.allergic_comments,
         COALESCE(c.is_npo, false) AS is_npo, COALESCE(c.is_risk_anesthesia, false) AS is_risk_anesthesia, COALESCE(c.is_heart_murmur, false) AS is_heart_murmur, COALESCE(c.is_amb, false) AS is_amb, CASE WHEN c.release_date IS NULL THEN false ELSE true END AS is_released,
         to_char(c.procedure_date, 'DD/MM/YYYY') AS procedure_date, to_char(c.procedure_date, 'YYYY-MM-DD') AS procedure_date_for_input, c.blood_test_link
  FROM petec.case c
  LEFT JOIN petec.patient p ON c.patient_id = p.id
  LEFT JOIN petec.animal_color ac ON p.animal_color_id = ac.id
  LEFT JOIN petec.gender_type gt ON p.gender_id = gt.id
  LEFT JOIN petec.animal_type at ON p.animal_id = at.id
  LEFT JOIN petec.food_type ft ON p.food_type_id = ft.id
  LEFT JOIN petec.user u ON c.doctor_id = u.id
  LEFT JOIN petec.insurance_type it ON p.insurance_id = it.id
  WHERE c.id = $1 AND COALESCE(c.is_deleted, false) = false
`,
  getUsers: `
  SELECT u.id, u.username, u.first_name, u.last_name, u.email, ur.id AS role_id, ur.name AS role_name
  FROM petec.user u
  LEFT JOIN petec.user_role ur ON u.role_id = ur.id
  WHERE COALESCE(u.is_deleted, false) = false
`,
  getMedicines: `
  SELECT m.id, m.name, m.measure_unit_id, mut.name AS measure_unit, m.created_at, mc.name AS medicine_category, m.category_id, m.range_max, m.range_min,
         m.total_dose, m.comments, df.id AS dosage_frequency_id, roa.id AS route_of_administration_id, df.name AS dosage_frequency, roa.name AS route_of_administration
  FROM petec.medicine m
  LEFT JOIN petec.medicine_category mc ON mc.id = m.category_id
  LEFT JOIN petec.measure_unit_types mut ON mut.id = m.measure_unit_id
  LEFT JOIN petec.dosage_frequency df ON df.id = m.dosage_frequency_id
  LEFT JOIN petec.route_of_administration roa ON roa.id = m.route_of_administration_id
`,
  getAnimalColors: `
  SELECT id, name, created_at
  FROM petec.animal_color
`,
  getAnimalTypes: `
  SELECT id, name, created_at
  FROM petec.animal_type
`,
  getFecesTypes: `
  SELECT id, name, created_at
  FROM petec.feces_type
`,
  getUrineTypes: `
  SELECT id, name, created_at
  FROM petec.urine_type
`,
  getFoodTypes: `
  SELECT id, name, created_at
  FROM petec.food_type
`,
  getGenderTypes: `
  SELECT id, name, created_at
  FROM petec.gender_type
`,
  getRaceTypes: `
  SELECT rc.id, rc.name, rc.created_at, at.name animal_type, at.id animal_type_id
  FROM petec.race_type rc
  LEFT JOIN petec.animal_type at ON rc.animal_id = at.id
`,
  getMeasureUnitTypes: `
  SELECT id, name, created_at
  FROM petec.measure_unit_types
`,
  getDosageFrequencyTypes: `
  SELECT id, name, created_at, description, description_per_hour
  FROM petec.dosage_frequency
`,
  getInsuranceTypes: `
  SELECT id, name, created_at
  FROM petec.insurance_type
`,
  getFoodExtrasTypes: `
  SELECT id, name, created_at
  FROM petec.food_extra_type
`,
  getProceduresTypes: `
  SELECT id, name, created_at
  FROM petec.procedure_type
  `,
  getExaminationTypes: `
  SELECT id, name, created_at
  FROM petec.examination_type
`,
  getRouteOfAdministration: `
  SELECT id, name, description, created_at
  FROM petec.route_of_administration
`,
  getAnimalVitals: `
  SELECT av.id, av.vitals_type, av.created_at, av.range_max, av.range_min, at.name animal_type, at.id animal_type_id
  FROM petec.animal_vitals av
  LEFT JOIN petec.animal_type at ON at.id = av.animal_id
  `,
  getAllDoctors: `
  SELECT u.id, u.first_name || ' ' || u.last_name AS name
  FROM petec.user u
  LEFT JOIN petec.user_role ur ON u.role_id = ur.id
  WHERE ur.name = 'רופא' AND COALESCE(u.is_deleted, false) = false
`,
  getAllNurses: `
  SELECT u.id, u.first_name || ' ' || u.last_name AS name
  FROM petec.user u
  LEFT JOIN petec.user_role ur ON u.role_id = ur.id
  WHERE ur.name = 'אחות' AND COALESCE(u.is_deleted, false) = false
`,
  getAuditLog: `
  SELECT ad.id, ad.subject, ad.description, ad.created_at, u.first_name || ' ' || u.last_name AS created_by_name,
         p.name AS patient_name, c.id AS case_id
  FROM petec.audit_log ad
  LEFT JOIN petec.user u ON ad.created_by = u.id
  LEFT JOIN petec.patient p ON ad.patient_id = p.id
  LEFT JOIN petec.case c ON ad.case_id = c.id
  `,
  getCaseDailyDetails: `
  SELECT cdd.id, cdd.time, to_char(cdd.date, 'YYYY-MM-DD') AS date,
         cdd.temp AS \"T\", cdd.temp_is_required AS \"T_is_required\", cdd.temp_is_editable AS \"T_is_editable\",
         cdd.pulse AS \"P\", cdd.pulse_is_required AS \"P_is_required\", cdd.pulse_is_editable AS \"P_is_editable\",
         cdd.respiration AS \"R\", cdd.respiration_is_required AS \"R_is_required\", cdd.respiration_is_editable AS \"R_is_editable\",
         cdd.food_and_water AS \"foodAndWater\", cdd.food_and_water_is_required AS \"foodAndWater_is_required\", cdd.food_and_water_is_editable AS \"foodAndWater_is_editable\",
         cdd.is_walk_trip AS \"isTravel\", cdd.is_walk_trip_is_required AS \"isTravel_is_required\", cdd.is_walk_trip_is_editable AS \"isTravel_is_editable\",
         cdd.is_box_clean AS \"isBoxClean\", cdd.is_box_clean_is_required AS \"isBoxClean_is_required\", cdd.is_box_clean_is_editable AS \"isBoxClean_is_editable\",
         cdd.weigh, cdd.weigh_is_required, cdd.weigh_is_editable, cdd.is_release AS \"isRelease\", cdd.is_release_is_required AS \"isRelease_is_required\", cdd.is_release_is_editable AS \"isRelease_is_editable\",
         cdd.owner_update AS \"ownerUpdate\", cdd.owner_update_is_required AS \"ownerUpdate_is_required\", cdd.owner_update_is_editable AS \"ownerUpdate_is_editable\",
         cdd.is_puke AS \"isPuke\", cdd.puke_comments AS \"pukeComments\", cdd.puke_is_required AS \"puke_is_required\", cdd.puke_is_editable AS \"puke_is_editable\",
         cdd.urine_type_id AS \"urineTypeId\", ut.name AS \"urineTypeText\", cdd.urine_comments AS \"urineComments\", cdd.urine_is_required AS \"urine_is_required\", cdd.urine_is_editable AS \"urine_is_editable\",
         cdd.feces_type_id AS \"fecesTypeId\", ft.name AS \"fecesTypeText\", cdd.feces_comments AS \"fecesComments\", cdd.feces_is_required AS \"feces_is_required\", cdd.feces_is_editable AS \"feces_is_editable\",
         cdd.comments, cdd.comments_is_required, cdd.comments_is_editable
  FROM petec.case_daily_details cdd
  LEFT JOIN petec.urine_type ut ON ut.id = cdd.urine_type_id
  LEFT JOIN petec.feces_type ft ON ft.id = cdd.feces_type_id
  WHERE case_id = $1
  ORDER BY cdd.id
`,
  getCaseDailyDetailsMedicines: `
  SELECT cm.id AS medicine_id, cddm.is_given AS \"isGiven\", cddm.is_required AS \"isRequired\", cddm.is_editable AS \"isEditable\", cddm.comment
  FROM petec.case_daily_details_medicines cddm
  LEFT JOIN petec.case_medicines cm ON cm.id = cddm.case_medicines_id
  WHERE cddm.case_medicines_id = $1 AND cddm.case_daily_details_id = $2
`,
  getCaseDetailsMedicines: `
  SELECT cm.id, cm.medicine_id AS value, m.name AS text, m.measure_unit_id AS \"measureUnitId\", mut.name AS \"measureUnitText\", cm.frequency_id AS \"frequencyId\", df.name AS \"frequencyText\",
         cm.dose_amount AS \"doseAmount\", cm.route_of_administration_id AS \"medicineRouteId\", roa.name AS \"medicineRouteText\", m.range_max AS \"rangeMax\", m.range_min AS \"rangeMin\", m.total_dose AS \"totalDose\", m.comments
  FROM petec.case_medicines cm
  LEFT JOIN petec.medicine m ON m.id = cm.medicine_id
  LEFT JOIN petec.dosage_frequency df ON df.id = cm.frequency_id
  LEFT JOIN petec.route_of_administration roa ON roa.id = cm.route_of_administration_id
  LEFT JOIN petec.measure_unit_types mut ON mut.id = m.measure_unit_id
  WHERE case_id = $1 AND is_Medicine = $2 AND cm.id IN (
                                                        SELECT case_medicines_id
                                                        FROM petec.case_daily_details_medicines
                                                        WHERE case_daily_details_id = ANY($3::int[])
                                                       )
  ORDER BY cm.id DESC
`,
  getCaseDailyDetailsFoodExtras: `
  SELECT cfe.id as food_extra_id, cddfe.is_given AS \"isGiven\", cddfe.is_required AS \"isRequired\", cddfe.is_editable AS \"isEditable\"
  FROM petec.case_daily_details_food_extras cddfe
  LEFT JOIN petec.case_food_extras cfe ON cfe.id = cddfe.case_food_extras_id
  WHERE cddfe.case_food_extras_id = $1 AND cddfe.case_daily_details_id = $2
`,
  getCaseDetailsFoodExtras: `
  SELECT cfe.id, cfe.food_extra_id AS value, fxt.name AS text
  FROM petec.case_food_extras cfe
  LEFT JOIN petec.food_extra_type fxt ON fxt.id = cfe.food_extra_id
  WHERE case_id = $1 AND cfe.id IN (
                                    SELECT case_food_extras_id
                                    FROM petec.case_daily_details_food_extras
                                    WHERE case_daily_details_id = ANY($2::int[])
                                   )
`,
  getCaseDailyDetailsProcedures: `
  SELECT cp.id as procedure_id, cddp.is_given AS \"isGiven\", cddp.is_required AS \"isRequired\", cddp.is_editable AS \"isEditable\"
  FROM petec.case_daily_details_procedures cddp
  LEFT JOIN petec.case_procedures cp ON cp.id = cddp.case_procedures_id
  WHERE cddp.case_procedures_id = $1 AND cddp.case_daily_details_id = $2
`,
  getCaseDetailsProcedures: `
  SELECT cp.id, cp.procedure_id AS value, pt.name AS text
  FROM petec.case_procedures cp
  LEFT JOIN petec.procedure_type pt ON pt.id = cp.procedure_id
  WHERE case_id = $1 AND cp.id IN (
                                    SELECT case_procedures_id
                                    FROM petec.case_daily_details_procedures
                                    WHERE case_daily_details_id = ANY($2::int[])
                                   )
`,
  getCaseDailyDetailsExaminations: `
  SELECT ce.id as examination_id, cdde.value AS value, cdde.is_required AS \"isRequired\", cdde.is_editable AS \"isEditable\"
  FROM petec.case_daily_details_examinations cdde
  LEFT JOIN petec.case_examinations ce ON ce.id = cdde.case_examinations_id
  WHERE cdde.case_examinations_id = $1 AND cdde.case_daily_details_id = $2
`,
  getCaseDetailsExaminations: `
  SELECT ce.id, ce.examination_id AS value, et.name AS text
  FROM petec.case_examinations ce
  LEFT JOIN petec.examination_type et ON et.id = ce.examination_id
  WHERE case_id = $1 AND ce.id IN (
                                    SELECT case_examinations_id
                                    FROM petec.case_daily_details_examinations
                                    WHERE case_daily_details_id = ANY($2::int[])
                                   )
  ORDER BY ce.id DESC
`,
  getCaseReleaseMedicines: `
  SELECT pm.medicine_id AS value, m.name AS text, m.measure_unit_id AS \"measureUnitId\", mut.name AS \"measureUnitText\", pm.frequency_id AS \"frequencyId\", df.name AS \"frequencyText\",
         pm.dose_amount AS \"doseAmount\", pm.route_of_administration_id AS \"medicineRouteId\", roa.name AS \"medicineRouteText\", m.range_max AS \"rangeMax\", m.range_min AS \"rangeMin\", m.total_dose AS \"totalDose\", m.comments
  FROM petec.patient_medicine pm
  LEFT JOIN petec.medicine m ON m.id = pm.medicine_id
  LEFT JOIN petec.dosage_frequency df ON df.id = pm.frequency_id
  LEFT JOIN petec.route_of_administration roa ON roa.id = pm.route_of_administration_id
  LEFT JOIN petec.measure_unit_types mut ON mut.id = m.measure_unit_id
  WHERE case_id = $1
`,
  deletePreviousCaseDetailsMedicines: `
  DELETE FROM petec.case_daily_details_medicines
  WHERE case_daily_details_id IN (
                                   SELECT id
                                   FROM petec.case_daily_details
                                   WHERE case_id = $1
                                   )
`,
  deletePreviousCaseDetailsFoodExtras: `
  DELETE FROM petec.case_daily_details_food_extras
  WHERE case_daily_details_id IN (
                                  SELECT id
                                  FROM petec.case_daily_details
                                  WHERE case_id = $1
                                 )
`,
  deletePreviousCaseDetailsProcedures: `
  DELETE FROM petec.case_daily_details_procedures
  WHERE case_daily_details_id IN (
                                  SELECT id
                                  FROM petec.case_daily_details
                                  WHERE case_id = $1
                                 )
`,
  deletePreviousCaseDetailsExaminations: `
  DELETE FROM petec.case_daily_details_examinations
  WHERE case_daily_details_id IN (
                                  SELECT id
                                  FROM petec.case_daily_details
                                  WHERE case_id = $1
                                 )
`,
  getReleaseMedicinesForExport: `
  SELECT m.id AS medicineId, m.name AS medicine_name, pm.dose_amount, df.name AS frequency_text, roa.name AS medicine_route_text, mut.name AS measure_unit_text
  FROM petec.patient_medicine pm
  LEFT JOIN petec.medicine m ON m.id = pm.medicine_id
  LEFT JOIN petec.dosage_frequency df ON df.id = pm.frequency_id
  LEFT JOIN petec.route_of_administration roa ON roa.id = pm.route_of_administration_id
  LEFT JOIN petec.measure_unit_types mut ON mut.id = m.measure_unit_id
  WHERE pm.case_id = $1
  `,
  getChartsTemperatureData: `
  SELECT temp AS value, to_char(time, 'HH24:MI') || ' ' || to_char(date, 'DD/MM/YYYY') AS name
  FROM petec.case_daily_details
  WHERE case_id = $1 AND temp IS NOT NULL
  ORDER BY id;
  `,
  getChartsPulseData: `
  SELECT pulse AS value, to_char(time, 'HH24:MI') || ' ' || to_char(date, 'DD/MM/YYYY') AS name
  FROM petec.case_daily_details
  WHERE case_id = $1 AND pulse IS NOT NULL
  ORDER BY id;
  `,
  getChartsRespirationData: `
  SELECT respiration AS value, to_char(time, 'HH24:MI') || ' ' || to_char(date, 'DD/MM/YYYY') AS name
  FROM petec.case_daily_details
  WHERE case_id = $1 AND respiration IS NOT NULL
  ORDER BY id;
  `,
  getChartsWeightData: `
  SELECT weigh AS value, to_char(time, 'HH24:MI') || ' ' || to_char(date, 'DD/MM/YYYY') AS name
  FROM petec.case_daily_details
  WHERE case_id = $1 AND weigh IS NOT NULL
  ORDER BY id;
  `,
  getMasterCaseDetails: `
  SELECT mcc.case_id AS \"caseId\", p.name AS \"patientName\", p.photo_name AS \"patientPhotoName\"
  FROM petec.master_case_cases mcc
  LEFT JOIN petec.case c ON mcc.case_id = c.id
  LEFT JOIN petec.patient p ON p.id = c.patient_id
  WHERE mcc.master_case_id = $1 AND COALESCE(c.is_deleted, false) = false
  `,
  getDailyPlanDetails: `
  SELECT mc.id AS master_case_id, c.id AS case_id, p.name, p.owner_name, p.owner_phone_number, c.hospitalization_reason,
         CASE WHEN c.daily_plan_comments_created_at >= (SELECT date_trunc('day', (now() AT TIME ZONE 'Asia/Jerusalem')::timestamp)) THEN c.daily_plan_comments ELSE NULL END AS daily_plan_comments
  FROM petec.master_case mc
  LEFT JOIN petec.master_case_cases mcc ON mc.id = mcc.master_case_id
  LEFT JOIN petec.case c ON mcc.case_id = c.id
  LEFT JOIN petec.patient p ON p.id = c.patient_id
  WHERE COALESCE(c.is_archived, false) = false AND COALESCE(c.is_deleted, false) = false
  ORDER BY mc.id
  `,
  getDailyPlanDetailsCaseProcedures: `
  SELECT pt.name, cddp.is_given AS value, to_char(cdd.time, 'HH24:MI') || ' ' || to_char(cdd.date, 'DD/MM/YYYY') AS date
  FROM petec.case_daily_details cdd
  LEFT JOIN petec.case_daily_details_procedures cddp ON cdd.id = cddp.case_daily_details_id
  LEFT JOIN petec.case_procedures cp ON cp.id = cddp.case_procedures_id
  LEFT JOIN petec.procedure_type pt ON pt.id = cp.procedure_id
  WHERE cdd.case_id = $1 AND (cddp.is_required = true OR COALESCE(cddp.is_given, false) = true) AND cdd.date + cdd.time >= (SELECT date_trunc('day', (now() AT TIME ZONE 'Asia/Jerusalem')::timestamp))
  ORDER BY cdd.id DESC
  `,
  getDailyPlanDetailsCaseExaminations: `
  SELECT et.name, COALESCE(cdde.value, '') AS value, to_char(cdd.time, 'HH24:MI') || ' ' || to_char(cdd.date, 'DD/MM/YYYY') AS date
  FROM petec.case_daily_details cdd
  LEFT JOIN petec.case_daily_details_examinations cdde ON cdd.id = cdde.case_daily_details_id
  LEFT JOIN petec.case_examinations ce ON ce.id = cdde.case_examinations_id
  LEFT JOIN petec.examination_type et ON et.id = ce.examination_id
  WHERE cdd.case_id = $1 AND (cdde.is_required = true OR COALESCE(cdde.value, '') <> '') AND cdd.date + cdd.time >= (SELECT date_trunc('day', (now() AT TIME ZONE 'Asia/Jerusalem')::timestamp))
  ORDER BY cdd.id DESC
  `,
  getDailyPlanDetailsOwnerUpdate: `
  SELECT COALESCE(cdd.owner_update, '') AS value, to_char(cdd.time, 'HH24:MI') || ' ' || to_char(cdd.date, 'DD/MM/YYYY') AS date
  FROM petec.case_daily_details cdd
  WHERE cdd.case_id = $1 AND (cdd.owner_update_is_required = true OR COALESCE(cdd.owner_update, '') <> '') AND cdd.date + cdd.time >= (SELECT date_trunc('day', (now() AT TIME ZONE 'Asia/Jerusalem')::timestamp))
  ORDER BY cdd.id DESC
  `,
  getDailyPlanDetailsReleaseMedicines: `
  SELECT COALESCE(cdd.is_release, false) AS value, to_char(cdd.time, 'HH24:MI') || ' ' || to_char(cdd.date, 'DD/MM/YYYY') AS date
  FROM petec.case_daily_details cdd
  WHERE cdd.case_id = $1 AND (cdd.is_release_is_required = true OR COALESCE(cdd.is_release, false) = true) AND cdd.date + cdd.time >= (SELECT date_trunc('day', (now() AT TIME ZONE 'Asia/Jerusalem')::timestamp))
  ORDER BY cdd.id DESC
  `,
};
