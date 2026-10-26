import {describe,it,expect} from 'vitest';
import {allowedPath,original,oldLocator,newLocator,validatePatch} from '../server/repair';
const fixed=original.replace(oldLocator,newLocator);
describe('strict locator patch',()=>{
 it('accepts exactly one replacement',()=>expect(validatePatch(allowedPath,original,fixed)).toBe(fixed));
 for(const [name,after] of [['assertion',fixed.replace('保存成功','尚未保存')],['skip',fixed.replace("test('","test.skip('")],['body',original.replace(oldLocator,"locator('body')")]])it(`rejects ${name}`,()=>expect(()=>validatePatch(allowedPath,original,after)).toThrow());
 it('rejects outside path',()=>expect(()=>validatePatch('../outside.ts',original,fixed)).toThrow());
 it('rejects modified original',()=>expect(()=>validatePatch(allowedPath,original+'\n',fixed)).toThrow());
});
