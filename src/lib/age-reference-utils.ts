/**
 * Utility to match patient age/gender to the correct reference range
 * from parameter_reference_ranges table.
 */

interface RefRange {
  parameter_id: string;
  age_group: string;
  gender: string;
  reference_value: string;
  sort_order: number;
}

/** Convert age group label to an age range in days for matching */
function ageGroupToDays(group: string): { min: number; max: number } {
  const g = group.toLowerCase().trim();

  // Exact matches first
  if (g.includes("rn") || g.includes("cordão") || g.includes("nascimento")) return { min: 0, max: 0 };
  if (g === "1 a 3 dias") return { min: 1, max: 3 };
  if (g === "1 a 7 dias") return { min: 1, max: 7 };
  if (g === "1 semana") return { min: 4, max: 7 };
  if (g === "2 semanas") return { min: 8, max: 14 };
  if (g === "8 a 14 dias") return { min: 8, max: 14 };
  if (g === "15 a 30 dias") return { min: 15, max: 30 };
  if (g === "1 mês" || g === "1 mes") return { min: 15, max: 30 };
  if (g === "2 meses") return { min: 31, max: 60 };
  if (g === "2 a 5 meses") return { min: 31, max: 150 };
  if (g === "3 a 6 meses") return { min: 61, max: 180 };
  if (g === "6 a 11 meses") return { min: 181, max: 330 };
  if (g === "6 meses a 2 anos") return { min: 181, max: 730 };
  if (g === "1 a 2 anos") return { min: 365, max: 730 };
  if (g === "2 a 6 anos") return { min: 731, max: 2190 };
  if (g === "3 a 5 anos") return { min: 1095, max: 1825 };
  if (g === "6 a 11 anos") return { min: 2191, max: 4015 };
  if (g === "6 a 12 anos") return { min: 2191, max: 4380 };
  if (g === "12 a 15 anos") return { min: 4381, max: 5475 };
  if (g === "12 a 18 anos") return { min: 4381, max: 6570 };

  // Pattern: "X a Y anos"
  const anosMatch = g.match(/(\d+)\s*a\s*(\d+)\s*anos/);
  if (anosMatch) {
    return { min: parseInt(anosMatch[1]) * 365, max: parseInt(anosMatch[2]) * 365 };
  }
  // Pattern: "X a Y meses"
  const mesesMatch = g.match(/(\d+)\s*a\s*(\d+)\s*meses/);
  if (mesesMatch) {
    return { min: parseInt(mesesMatch[1]) * 30, max: parseInt(mesesMatch[2]) * 30 };
  }
  // Pattern: "X a Y dias"
  const diasMatch = g.match(/(\d+)\s*a\s*(\d+)\s*dias/);
  if (diasMatch) {
    return { min: parseInt(diasMatch[1]), max: parseInt(diasMatch[2]) };
  }

  if (g.includes("adulto") || g.includes("> 16") || g.includes(">16")) return { min: 5840, max: 999999 };

  // Fallback: very wide range
  return { min: 0, max: 999999 };
}

function genderMatches(refGender: string, patientGender: string): boolean {
  const rg = refGender.toLowerCase().trim();
  if (rg === "ambos" || rg === "") return true;
  const pg = patientGender.toLowerCase().trim();
  if (rg === "masculino" && (pg === "m" || pg === "masculino" || pg === "homem")) return true;
  if (rg === "feminino" && (pg === "f" || pg === "feminino" || pg === "mulher")) return true;
  // Also check if the age_group contains gender hints
  return false;
}

/**
 * Find the best matching reference value for a parameter given patient age and gender.
 * Returns the reference_value string, or null if no match found.
 */
export function findAgeBasedReference(
  paramId: string,
  patientBirthDate: string,
  patientGender: string,
  allRefRanges: RefRange[]
): string | null {
  const paramRanges = allRefRanges.filter(r => r.parameter_id === paramId);
  if (paramRanges.length === 0) return null;

  // Calculate patient age in days
  const birth = new Date(patientBirthDate);
  const now = new Date();
  const ageDays = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));

  // First pass: find gender-specific match
  let bestMatch: RefRange | null = null;
  let bestSpecificity = -1;

  for (const ref of paramRanges) {
    const range = ageGroupToDays(ref.age_group);
    if (ageDays >= range.min && ageDays <= range.max && genderMatches(ref.gender, patientGender)) {
      // Check if age_group contains gender hint (e.g., "12 a 18 anos - mulher")
      const ageGroupLower = ref.age_group.toLowerCase();
      const hasGenderHint = ageGroupLower.includes("mulher") || ageGroupLower.includes("homem") ||
        ageGroupLower.includes("masculino") || ageGroupLower.includes("feminino");

      let specificity = (range.max - range.min); // smaller range = more specific (lower is better)
      // Prefer gender-specific over "Ambos"
      const isGenderSpecific = ref.gender.toLowerCase() !== "ambos" || hasGenderHint;
      
      if (bestMatch === null) {
        bestMatch = ref;
        bestSpecificity = specificity;
      } else {
        // Prefer gender-specific matches
        const bestIsGenderSpecific = bestMatch.gender.toLowerCase() !== "ambos" ||
          bestMatch.age_group.toLowerCase().includes("mulher") || bestMatch.age_group.toLowerCase().includes("homem");
        
        if (isGenderSpecific && !bestIsGenderSpecific) {
          bestMatch = ref;
          bestSpecificity = specificity;
        } else if (isGenderSpecific === bestIsGenderSpecific && specificity < bestSpecificity) {
          bestMatch = ref;
          bestSpecificity = specificity;
        }
      }
    }
  }

  return bestMatch?.reference_value || null;
}

/**
 * Resolve the reference range for a parameter: use age-based if available, otherwise fallback to static.
 */
export function resolveReferenceRange(
  paramId: string,
  staticRef: string,
  patientBirthDate: string | null,
  patientGender: string,
  allRefRanges: RefRange[]
): string {
  if (!patientBirthDate) return staticRef || "";
  const ageRef = findAgeBasedReference(paramId, patientBirthDate, patientGender, allRefRanges);
  return ageRef || staticRef || "";
}
