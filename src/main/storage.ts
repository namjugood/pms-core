/**
 * 파일 저장 및 로드 관리
 * JSON 데이터를 Base64로 인코딩하여 .dat 파일로 저장
 */

import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * 데이터를 .dat 파일로 저장
 * @param data 저장할 데이터 객체
 * @param filePath 저장할 파일 경로
 */
export async function saveDataFile(data: any, filePath: string): Promise<void> {
  try {
    // JSON 직렬화
    const jsonString = JSON.stringify(data, null, 2);
    
    // Base64 인코딩 (간단한 암호화)
    const encoded = Buffer.from(jsonString, 'utf-8').toString('base64');
    
    // 파일 저장
    await fs.writeFile(filePath, encoded, 'utf-8');
  } catch (error) {
    console.error('파일 저장 오류:', error);
    throw new Error('파일 저장에 실패했습니다.');
  }
}

/**
 * .dat 파일에서 데이터 로드
 * @param filePath 로드할 파일 경로
 * @returns 파싱된 데이터 객체
 */
export async function loadDataFile(filePath: string): Promise<any> {
  try {
    // 파일 읽기
    const encoded = await fs.readFile(filePath, 'utf-8');
    
    // Base64 디코딩
    const jsonString = Buffer.from(encoded, 'base64').toString('utf-8');
    
    // JSON 파싱
    const data = JSON.parse(jsonString);
    
    return data;
  } catch (error) {
    console.error('파일 로드 오류:', error);
    throw new Error('파일 로드에 실패했습니다.');
  }
}

/**
 * 디렉터리가 존재하는지 확인하고 없으면 생성
 * @param dirPath 디렉터리 경로
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

