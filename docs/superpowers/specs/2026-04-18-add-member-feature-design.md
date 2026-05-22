# Spec: Add Member Feature Implementation

## Context

Implementation of "Add Member" feature in the Member Dashboard. The mechanism should be identical to the organization/branch management (using Sheets, Server Actions, and specific sequential registration numbers).

## Registration Number Logic (XXYYZZZZNNN)

The registration number is permanent and unique, generated at the entry point:

- **XX**: PW Code (2 digits).
- **YY**: PD Code (2 digits).
- **ZZZZ**: Entry Year (4 digits).
- **NNN**: Sequential Number (3 digits, 001-999).

### Parsing Rules:

1. **PD/PK**: Use code prefix (e.g., '19.PD-1' -> XX=19, YY=01).
2. **PDLN**: PW=99, PD from code suffix (e.g., 'PD.LN-8' -> XX=99, YY=08).
3. **PK under PW**: PW from code suffix, PD=00 (e.g., 'PW1' -> XX=01, YY=00).
4. **PP constraint**: Registration directly under PP is forbidden.

## UI Components

- **Sheet**: Using `Sheet` from shadcn/ui.
- **Form**: `AddMemberForm` with fields: Name, Gender, Status, Year of Entry.
- **Store**: `memberSheetStore` using nanostores.

## Implementation Steps

1. Create registration number generator utility.
2. Create nanostore for UI state.
3. Implement Server Action for member creation (including user account creation).
4. Create the Form component.
5. Integrate the "Add Member" button into `MembersTable`.
