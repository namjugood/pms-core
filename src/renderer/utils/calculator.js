/**
 * 평가 점수 계산 유틸리티
 * 비중과 점수를 기반으로 평가점수를 계산
 */

/**
 * 개별 평가점수 계산
 * @param {number} weight 비중 (%)
 * @param {number} score 점수
 * @returns {number} 평가점수 (비중 × 점수 / 100)
 */
function calculateEvaluationScore(weight, score) {
  if (isNaN(weight) || isNaN(score)) {
    return 0;
  }
  return (weight * score) / 100;
}

/**
 * 모든 행의 합계 계산
 * @param {Array} rows 행 데이터 배열
 * @returns {Object} 합계 데이터
 */
function calculateTotals(rows) {
  let weightTotal = 0;
  let prevWeightTotal = 0;
  let currentScoreTotal = 0;
  let prevScoreTotal = 0;

  rows.forEach(row => {
    weightTotal += row.weight || 0;
    prevWeightTotal += row.prevWeight || 0;
    currentScoreTotal += row.evaluationScore || 0;
    prevScoreTotal += row.prevEvaluationScore || 0;
  });

  const difference = currentScoreTotal - prevScoreTotal;

  return {
    weightTotal: Math.round(weightTotal * 10) / 10,
    prevWeightTotal: Math.round(prevWeightTotal * 10) / 10,
    currentScoreTotal: Math.round(currentScoreTotal * 100) / 100,
    prevScoreTotal: Math.round(prevScoreTotal * 100) / 100,
    difference: Math.round(difference * 100) / 100
  };
}

/**
 * 숫자 값 파싱 (안전하게)
 * @param {any} value 파싱할 값
 * @returns {number} 숫자 또는 0
 */
function parseNumberSafe(value) {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

/**
 * 숫자를 소수점 한 자리로 포맷 (비중 합계용)
 * @param {number} value 포맷할 숫자
 * @returns {string} 포맷된 문자열
 */
function formatNumber(value) {
  return value.toFixed(1);
}

/**
 * 숫자를 소수점 제한 없이 표시 (개별 행 평가점수용)
 * @param {number} value 포맷할 숫자
 * @returns {string} 포맷된 문자열
 */
function formatNumberFull(value) {
  // 소수점 이하가 있으면 표시, 없으면 정수로 표시
  return value % 1 === 0 ? value.toFixed(0) : value.toString();
}

/**
 * 숫자를 소수점 2자리로 반올림하여 포맷 (합계용)
 * @param {number} value 포맷할 숫자
 * @returns {string} 포맷된 문자열
 */
function formatNumberRounded(value) {
  return Math.round(value * 100) / 100;
}

