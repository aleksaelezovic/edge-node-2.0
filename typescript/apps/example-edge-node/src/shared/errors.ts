export class ErrorWithCode<Code extends string> extends Error {
  constructor(
    message: string,
    public code: Code,
  ) {
    super(message);
  }
}
