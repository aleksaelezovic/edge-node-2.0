export class ErrorWithCode<Code extends string = string> extends Error {
  constructor(
    message: string,
    public code: Code,
  ) {
    super(message);
  }
}
