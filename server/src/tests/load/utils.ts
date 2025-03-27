import { check } from 'k6';
import http from 'k6/http';

export function checkStatus(
  res: http.Response,
  status: number = 200,
  label = 'status is 200',
) {
  check(res, {
    [label]: (r) => r.status === status,
  });
}
