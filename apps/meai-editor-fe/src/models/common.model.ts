export type TResult<T> = {
  value: T
  isSuccess: boolean
  isFailure: boolean
  error?: {
    code: string
    description: string
  }
}
