# Company Logo — Upload Instructions
# ====================================
#
# Place your company logo file in THIS folder with the exact filename:
#
#     company_logo.png    ← preferred (PNG with transparent background)
#   OR
#     company_logo.jpg    ← JPEG also works
#
# Requirements:
#   - Recommended size : 400 × 120 px  (landscape / wide format)
#   - Max file size    : 2 MB
#   - Background       : Transparent PNG is ideal for the dark cover page
#
# What happens:
#   - The logo is automatically embedded as a base64 data URI
#     in the generated HTML / PDF proposal.
#   - It appears in the TOP-LEFT corner of the cover page
#     and at the bottom of the closing page.
#   - If no logo file is found, the text "YourCompany" is shown instead.
#
# To update the logo path, edit:
#   backend/app/services/proposal/renderer.py  →  LOGO_PATH constant
