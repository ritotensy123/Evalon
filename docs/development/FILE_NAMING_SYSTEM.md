# Custom File Naming System

## Overview
The Evalon backend now uses a custom file naming system that makes uploaded files easily identifiable by including organization context and file type information.

## File Naming Convention

### Format
```
{fileType}_{orgCode}_{orgName}_{timestamp}_{randomSuffix}.{extension}
```

### For Documents with Specific Types
```
{fileType}_{orgCode}_{orgName}_{documentType}_{timestamp}_{randomSuffix}.{extension}
```

## Examples

### Logo Upload
- **Organization**: RFX (IN-RFX-2025-HEN)
- **Original File**: `company-logo.png`
- **Generated Name**: `logo_INRFX202_RFX_1704723456789_123456.png`

### Document Upload
- **Organization**: ABC School (IN-ABC-2025-XYZ)
- **Document Type**: certificate
- **Original File**: `school-certificate.pdf`
- **Generated Name**: `document_INABC202_ABCSchool_certificate_1704723456789_789012.pdf`

## File Types Supported

### Logos
- **Allowed Formats**: JPEG, JPG, PNG, GIF, WebP
- **Size Limit**: 2MB
- **Field Name**: `file` (with `fileType: 'logo'`)

### Documents
- **Allowed Formats**: PDF, Word, Excel, Text, Images
- **Size Limit**: 10MB
- **Field Name**: `file` (with `fileType: 'document'`)

## API Endpoints

### Upload Logo
```
POST /api/organizations/upload/logo
Content-Type: multipart/form-data

Form Data:
- file: [File]
- fileType: "logo"
- orgCode: "IN-RFX-2025-HEN"
- orgName: "RFX"
```

### Upload Document
```
POST /api/organizations/upload/document
Content-Type: multipart/form-data

Form Data:
- file: [File]
- fileType: "document"
- documentType: "certificate" (optional)
- orgCode: "IN-RFX-2025-HEN"
- orgName: "RFX"
```

## Response Format

```json
{
  "success": true,
  "message": "Logo uploaded successfully",
  "data": {
    "filename": "logo_INRFX202_RFX_1704723456789_123456.png",
    "originalName": "company-logo.png",
    "size": 245760,
    "mimetype": "image/png",
    "url": "/uploads/logo_INRFX202_RFX_1704723456789_123456.png",
    "organizationContext": {
      "orgCode": "IN-RFX-2025-HEN",
      "orgName": "RFX",
      "fileType": "logo"
    }
  }
}
```

## Utility Functions

### parseFilename(filename)
Extracts organization information from a filename.

```javascript
const info = parseFilename('logo_INRFX202_RFX_1704723456789_123456.png');
// Returns:
// {
//   fileType: 'logo',
//   orgCode: 'INRFX202',
//   orgName: 'RFX',
//   timestamp: '1704723456789',
//   randomSuffix: '123456',
//   extension: 'png'
// }
```

### generateFilename(fileType, orgCode, orgName, extension, documentType)
Generates a custom filename for a given context.

```javascript
const filename = generateFilename('document', 'IN-RFX-2025-HEN', 'RFX', '.pdf', 'certificate');
// Returns: "document_INRFX202_RFX_certificate_1704723456789_123456.pdf"
```

## Benefits

1. **Easy Identification**: Files can be easily identified by organization and type
2. **No Conflicts**: Timestamp and random suffix prevent naming conflicts
3. **Organized Storage**: Files are logically organized by organization context
4. **Searchable**: Filenames contain searchable organization information
5. **Type Safety**: Different file types have appropriate size limits and validation

## Frontend Integration

The frontend automatically passes organization context when uploading files:

```javascript
// Logo upload with organization context
const organizationContext = {
  orgCode: formData.orgCode,
  orgName: formData.organisationName
};
const response = await organizationAPI.uploadLogo(file, organizationContext);

// Document upload with organization context
const response = await organizationAPI.uploadDocument(file, organizationContext, 'certificate');
```

## File Management

- Files are stored in `/uploads/` directory
- Old files can be deleted using the `deleteFile()` utility function
- File URLs are generated using the `getFileUrl()` utility function

