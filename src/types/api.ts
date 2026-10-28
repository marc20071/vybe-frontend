export type ApiResponse<T>={data:T;message?:string};
export type ApiFailure={message:string;code?:string;statusCode?:number;details?:unknown};
