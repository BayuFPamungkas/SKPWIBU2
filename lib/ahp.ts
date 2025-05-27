export type Matrix = number[][]

export function normalizeMatrix(matrix: Matrix): Matrix {
  const colCount = matrix[0].length
  const rowCount = matrix.length
  const colSums = new Array(colCount).fill(0)
  
  for (let j = 0; j < colCount; j++) {
    for (let i = 0; i < rowCount; i++) {
      colSums[j] += matrix[i][j]
    }
  }

  const normalized = matrix.map(row =>
    row.map((val, j) => val / colSums[j])
  )

  return normalized
}

export function calculatePriorityVector(normalizedMatrix: Matrix): number[] {
  return normalizedMatrix.map(row => {
    const sum = row.reduce((a, b) => a + b, 0)
    return sum / row.length
  })
}

export function multiplyMatrixVector(matrix: Matrix, vector: number[]): number[] {
  return matrix.map(row =>
    row.reduce((sum, val, idx) => sum + val * vector[idx], 0)
  )
}

export function calculateConsistencyRatio(matrix: Matrix, priorityVector: number[]): number {
  const n = matrix.length
  const weightedSumVector = multiplyMatrixVector(matrix, priorityVector)
  const lambdaMax = weightedSumVector.reduce((sum, val, i) => sum + val / priorityVector[i], 0) / n
  const ci = (lambdaMax - n) / (n - 1)
  const riTable: { [key: number]: number } = {
    1: 0,
    2: 0,
    3: 0.58,
    4: 0.90,
    5: 1.12,
    6: 1.24,
    7: 1.32,
    8: 1.41,
    9: 1.45,
    10: 1.49
  }
  const ri = riTable[n] || 1.49
  const cr = ri === 0 ? 0 : ci / ri
  return cr
}
