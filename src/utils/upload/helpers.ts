export default class PostgrestError extends Error {
  details: string;
  hint: string;
  code: string;

  constructor(context: {
    message: string;
    details: string;
    hint: string;
    code: string;
  }) {
    super(context.message);
    this.name = "PostgrestError";
    this.details = context.details;
    this.hint = context.hint;
    this.code = context.code;
  }
}