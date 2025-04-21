import tseslint from 'typescript-eslint';
import { getTsLintConfigOption } from './eslint-rules';

export default tseslint.config(getTsLintConfigOption(__dirname));
