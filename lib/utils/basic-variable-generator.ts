import { variable } from '@rdfjs/data-model';

export default function varGenerator() {
  let i = 0;
  return () => {
    i += 1;
    return variable(`v${i}`);
  };
}
