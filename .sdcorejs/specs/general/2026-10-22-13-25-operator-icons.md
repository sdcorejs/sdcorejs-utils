---
{
  "approval_source": "explicit-user-choice",
  "approved_at": "2026-10-22T06:26:01.950Z",
  "approved_by": "user",
  "artifact_id": "spec-utils-operator-icons-r1",
  "artifact_kind": "spec",
  "change_ref": "utils-operator-icons",
  "commit_policy": "with-change",
  "contract_id": "utils-operator-icons",
  "execution_host_repository_id": "github.com/sdcorejs/sdcorejs-utils",
  "integration_owner_repository_id": "github.com/sdcorejs/sdcorejs-utils",
  "owner": "sdcorejs-plan",
  "owner_module_id": null,
  "owner_repository_id": "github.com/sdcorejs/sdcorejs-utils",
  "owner_repository_role": "library",
  "parent_references": [],
  "parent_repository_id": null,
  "repository_relative_path": ".sdcorejs/specs/general/2026-10-22-13-25-operator-icons.md",
  "requirement_id": "OPERATOR-ICONS",
  "schema_version": 1,
  "source_plan": "none",
  "source_revision": "dfe9fa7e05a9fbc86981f7f7c5872a6541bbbffc",
  "source_spec": ".sdcorejs/handoff/design-operator-icons/icons.md",
  "stack_profile": "node-general",
  "supersedes": null,
  "target_root_kind": "target-project",
  "track": "general",
  "approval_hash": "sha256:v1:1740324ff518a6df403e2b26e773b2f7824148e35f176ce1717d2725db093c31"
}
---
# Approved requirements

Ke hoach da duoc nguoi dung duyet bang "1" trong hoi thoai ngay 2026-10-22.
Thuc hien tren feat/is-abort-error, bao toan cac thay doi isAbortError hien co.

1. Luu PROMPT.md, icons.md va hai anh tu ZIP vao .sdcorejs/handoff/design-operator-icons/.
2. Viet src/constants/operator.constants.spec.ts truoc: Vitest + jsdom, 17 muc dung thu tu, value duy nhat, display giu nguyen, SVG hop le, loai phan tu, toa do 0-24, gioi han to dac, net phu dinh, 17 chuoi dung bang icons.md.
3. Sua src/constants/operator.constants.ts: icon va comment nhom van ban, BETWEEN, NULL/NOT_NULL. Giu kieu, export, value, display, thu tu.
4. Them .changeset/operator-icons.md muc patch, mo ta C1-C6, IN va NOT_NULL trong cung changeset.

Quyet dinh da duyet:
- Bang icons.md la nguon chinh; NOT_NULL la vong + cham, khong net gach.
- NOT_* con lai = icon goc + S, NULL co dung mot S.
- Giu width/height cua rect theo bang; consumer dat kich thuoc SVG va stroke-width.
- BETWEEN co bien hinh 4.5-19.5 theo toa do bang.
- README va site khong co mo ta hinh cu can sua; operator.model.ts va CHANGELOG lich su khong doi.
- Khong them dependency, doi manifest/lockfile, commit, push, version hay publish.

Kiem tra: npm run test -- src/constants/operator.constants.spec.ts (RED -> GREEN), npm run typecheck, npm run test:coverage, npm run build, npm run validate:package, npm run validate:site.
Bao cao file, spec, ket qua lenh, changeset va sai lech so voi icons.md.
