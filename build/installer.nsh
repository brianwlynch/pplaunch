!include nsDialogs.nsh
!include LogicLib.nsh
!include FileFunc.nsh
!include MUI2.nsh

!ifndef BUILD_UNINSTALLER

var settingsFile

var hPrefix
var hInstance
var hBase
var hGoofs
var hGameChk
var hUnit
var hLocation
var hCustomLoc
var hCustomLocLbl

var hMode
var hCustomUrl
var hLoading

var vMode
var vCustomUrl
var vLoading

var vPrefix
var vInstance
var vBase
var vGoofs
var vGameEnabled
var vUnit
var vLocation
var vCustomLoc

!macro customPageAfterChangeDir
    Page custom ModeCreate ModeLeave
    Page custom MainSettingsCreate MainSettingsLeave
    Page custom CustomUrlCreate CustomUrlLeave
    Page custom GameSettingsCreate GameSettingsLeave
!macroend

; ----- Get Existing Settings -----
; In: $R0 = key     Out: $R1 = value ("" if missing). Strips quotes and trailing comma.
Function ReadSetting
    Push $R2
    Push $R3
    Push $R4
    Push $R5
    StrCpy $R1 ""
    StrCpy $R3 '"$R0": '
    StrLen $R4 $R3
    ClearErrors
    FileOpen $R2 $settingsFile r
    IfErrors done
    loop:
        ClearErrors
        FileRead $R2 $R5
        IfErrors close
        trimEnd:                          ; strip \r \n
            StrCpy $R1 $R5 1 -1
            StrCmp $R1 "$\r" +2
            StrCmp $R1 "$\n" 0 trimStart
            StrCpy $R5 $R5 -1
            Goto trimEnd
        trimStart:                        ; strip leading spaces
            StrCpy $R1 $R5 1
            StrCmp $R1 " " 0 +3
            StrCpy $R5 $R5 "" 1
            Goto trimStart
        StrCpy $R1 $R5 $R4
        StrCmp $R1 $R3 found
        StrCpy $R1 ""
        Goto loop
    found:
        StrCpy $R1 $R5 "" $R4             ; text after the key
        StrCpy $R5 $R1 1 -1
        StrCmp $R5 "," 0 +2
        StrCpy $R1 $R1 -1                 ; drop trailing comma
        StrCpy $R5 $R1 1
        StrCmp $R5 '"' 0 close
        StrCpy $R1 $R1 -1 1               ; drop surrounding quotes
    close:
        FileClose $R2
    done:
    Pop $R5
    Pop $R4
    Pop $R3
    Pop $R2
FunctionEnd

!macro ReadInto key var
    StrCpy $R0 "${key}"
    Call ReadSetting
    StrCpy ${var} $R1
!macroend

!macro customInit
    Push $R0
    Push $R1
    SetShellVarContext current      ; logged in user's AppData
    StrCpy $settingsFile "$APPDATA\${PRODUCT_NAME}\settings.json"
    SetShellVarContext all
    ${If} ${FileExists} $settingsFile
        !insertmacro ReadInto REDIRECT_MODE   $vMode
        !insertmacro ReadInto CUSTOM_INSTANCE $vCustomUrl
        !insertmacro ReadInto LOADING_STRING  $vLoading
        !insertmacro ReadInto URL_PREFIX      $vPrefix
        !insertmacro ReadInto TFC_INSTANCE    $vInstance
        !insertmacro ReadInto BASE_URL        $vBase
        !insertmacro ReadInto GOOFS_ENABLED   $vGoofs
        !insertmacro ReadInto UNIT            $vUnit
        !insertmacro ReadInto LOCATION        $vLocation
        !insertmacro ReadInto CUSTOM_LOCATION $vCustomLoc
        ${If} $vInstance == "none"            ; the app's default = not configured
            StrCpy $vInstance ""
        ${EndIf}
    ${EndIf}
    Pop $R1
    Pop $R0
!macroend

; ----- Page 1: Mode Choice -----
Function ModeCreate
    !insertmacro MUI_HEADER_TEXT "Panel Settings" "Chose how this panel connects."
    nsDialogs::Create 1018
    Pop $0

    ${NSD_CreateLabel} 0 2u 60u 12u "Redirect Mode"
    ${NSD_CreateDropList} 65u 0 100u 40u ""
    Pop $hMode
    ${NSD_CB_AddString} $hMode "TFC Panel"
    ${NSD_CB_AddString} $hMode "Custom URL"
    ${If} $vMode == "custom"
        ${NSD_CB_SelectString} $hMode "Custom URL"
    ${Else}
        ${NSD_CB_SelectString} $hMode "TFC Panel"
    ${EndIf}

    ${NSD_CreateCheckbox} 0 82u 100% 12u "Enable goofs (Space Invaders and picture changes)"
    Pop $hGoofs
    ${NSD_Check} $hGoofs

        ${If} $vPrefix != ""
        ${NSD_CB_SelectString} $hPrefix $vPrefix
    ${EndIf}

    nsDialogs::Show
FunctionEnd

Function ModeLeave
    ${NSD_GetText} $hMode $0
    ${If} $0 == "Custom URL"
        StrCpy $vMode "custom"
    ${Else}
        StrCpy $vMode "tfc"
    ${EndIf}
    ${NSD_GetState} $hGoofs $vGoofs
FunctionEnd


; ----- Page 2: Main settings -----
Function MainSettingsCreate

    ${If} $vMode != "tfc"
        Abort ; Skip page in custom mode
    ${EndIf}

    !insertmacro MUI_HEADER_TEXT "TFC Settings" "Configure the TFC Instance for this panel."
    nsDialogs::Create 1018
    Pop $0

    ${NSD_CreateLabel} 0 0 100% 12u "URL: https:// [prefix] . [instance] . [base]"
    
    ${NSD_CreateLabel} 0 20u 60u 12u "Prefix"
    ${NSD_CreateDropList} 65u 18u 100u 80u ""
    Pop $hPrefix
    ${NSD_CB_AddString} $hPrefix "control"
    ${NSD_CB_AddString} $hPrefix "next"
    ${NSD_CB_SelectString} $hPrefix "control"

    ${NSD_CreateLabel} 0 40u 60u 12u "TFC Instance"
    ${NSD_CreateText} 65u 38u 100u 12u ""
    Pop $hInstance

    ${NSD_CreateLabel} 0 60u 60u 12u "Base URL"
    ${NSD_CreateDropList} 65u 58u 100u 80u ""
    Pop $hBase
    ${NSD_CB_AddString} $hBase ".nepgroup.io"
    ${NSD_CB_AddString} $hBase ".tfclabs.com"
    ${NSD_CB_SelectString} $hBase ".nepgroup.io"

    ${NSD_SetText} $hInstance $vInstance
    ${If} $vBase == "tfc"
        ${NSD_CB_SelectString} $hBase ".tfclabs.com"
    ${EndIf}

    nsDialogs::Show
FunctionEnd

Function MainSettingsLeave
    ${NSD_GetText} $hPrefix   $vPrefix
    ${NSD_GetText} $hInstance $vInstance
    ${NSD_GetText} $hBase     $vBase

    ${If} $vBase == ".tfclabs.com"
        StrCpy $vBase "tfc"
    ${Else}
        StrCpy $vBase "nep"
    ${EndIf}

    ${NSD_GetState} $hGoofs   $vGoofs
    ${If} $vInstance == ""
        MessageBox MB_ICONEXCLAMATION "Please enter a TFC instance."
        Abort   ; stays on the page
    ${EndIf}
FunctionEnd

; ----- Page 3: Custom Settings -----
Function CustomUrlCreate
    ${If} $vMode != "custom"
        Abort
    ${EndIf}
    !insertmacro MUI_HEADER_TEXT "Custom URL" "The page this panel should load."
    nsDialogs::Create 1018
    Pop $0

    ${NSD_CreateLabel} 0 2u 60u 12u "URL"
    ${NSD_CreateText} 65u 0 220u 12u ""
    Pop $hCustomUrl
    ${NSD_SetText} $hCustomUrl $vCustomUrl

    ${NSD_CreateLabel} 0 22u 60u 12u "Loading prefix"
    ${NSD_CreateText} 65u 20u 100u 12u ""
    Pop $hLoading
    ${NSD_SetText} $hLoading $vLoading
    ${NSD_CreateLabel} 170u 22u 60u 12u "Is Launching"

    nsDialogs::Show
FunctionEnd

Function CustomUrlLeave
    ${NSD_GetText} $hCustomUrl $vCustomUrl
    ${NSD_GetText} $hLoading   $vLoading
    StrCpy $0 $vCustomUrl 8
    ${If} $0 != "https://"
        MessageBox MB_ICONEXCLAMATION "Enter a full URL starting with https://"
        Abort
    ${EndIf}
FunctionEnd

; ----- Page 4: Game Settings (Optional) -----
Function GameControlsChanged
    Pop $0
    Call UpdateGameControls
FunctionEnd

Function UpdateGameControls
    ${NSD_GetState} $hGameChk $1

    ; Grey out if unchecked
    ${If} $1 == ${BST_CHECKED}
        EnableWindow $hUnit 1
        EnableWindow $hLocation 1
    ${Else}
        EnableWindow $hUnit 0
        EnableWindow $hLocation 0
    ${EndIf}

    ; Show custom location only when checked AND custom is picked

    SendMessage $hLocation ${CB_GETCURSEL} 0 0 $3
    ${If} $3 >= 0
        System::Call 'user32::SendMessage(p $hLocation, i ${CB_GETLBTEXT}, p r3, t .r2)'
    ${Else}
        StrCpy $2 ""
    ${EndIf}

    ${If} $1 == ${BST_CHECKED}
    ${AndIf} $2 == "Custom"
        ShowWindow $hCustomLocLbl ${SW_SHOW}
        ShowWindow $hCustomLoc ${SW_SHOW}
    ${Else}
        ShowWindow $hCustomLocLbl ${SW_HIDE}
        ShowWindow $hCustomLoc ${SW_HIDE}
    ${EndIf}
FunctionEnd

Function GameSettingsCreate
    !insertmacro MUI_HEADER_TEXT "Game Settings (optional)" "Leave unchecked to skip."
    nsDialogs::Create 1018
    Pop $0

    ${NSD_CreateCheckbox} 0 0 100% 12u "Configure game settings now (optional)"
    Pop $hGameChk

    ${NSD_CreateLabel} 0 22u 70u 12u "Unit (Specific Trailer)"
    ${NSD_CreateText} 75u 20u 100u 12u ""
    Pop $hUnit

    ${NSD_CreateLabel} 0 42u 60u 12u "Location"
    ${NSD_CreateDropList} 75u 40u 120u 120u ""
    Pop $hLocation
    ${NSD_CB_AddString} $hLocation "Audio"
    ${NSD_CB_AddString} $hLocation "Engineering"
    ${NSD_CB_AddString} $hLocation "Flex"
    ${NSD_CB_AddString} $hLocation "Production"
    ${NSD_CB_AddString} $hLocation "Replay"
    ${NSD_CB_AddString} $hLocation "Submix"
    ${NSD_CB_AddString} $hLocation "TD"
    ${NSD_CB_AddString} $hLocation "Video"
    ${NSD_CB_AddString} $hLocation "Non-Specific Location (tablet/iPad)"
    ${NSD_CB_AddString} $hLocation "Custom"

    ${NSD_CreateLabel} 0 62u 60u 12u "Custom Location"
    Pop $hCustomLocLbl
    ${NSD_CreateText} 75u 60u 100u 12u ""
    Pop $hCustomLoc

    ${NSD_OnClick} $hGameChk GameControlsChanged
    ${NSD_OnChange} $hLocation GameControlsChanged

    ${NSD_SetText} $hUnit $vUnit
    ${NSD_SetText} $hCustomLoc $vCustomLoc
    ${If} $vLocation != ""
        ${NSD_CB_SelectString} $hLocation $vLocation
    ${EndIf}

    ${If} $vGameEnabled == ""                 ; first visit: tick it if values already exist
        ${If} $vUnit != ""
        ${OrIf} $vLocation != ""
            ${NSD_Check} $hGameChk
        ${EndIf}
    ${ElseIf} $vGameEnabled == ${BST_CHECKED} ; came back via Back
        ${NSD_Check} $hGameChk
    ${EndIf}

    Call UpdateGameControls
    nsDialogs::Show
FunctionEnd

Function GameSettingsLeave
    ${NSD_GetState} $hGameChk  $vGameEnabled
    ${NSD_GetText}  $hUnit     $vUnit
    ${NSD_GetText}  $hLocation $vLocation
    ${If} $vLocation == "Non-Specific Location (tablet/iPad)"
        StrCpy $vLocation "non"
    ${EndIf}
    System::Call 'user32::CharLower(t $vLocation)t.r0'
    StrCpy $vLocation $0
    ${NSD_GetText}  $hCustomLoc $vCustomLoc
FunctionEnd

!endif

; ---------- Write file during install ----------
!macro customInstall
    ; Silent installs skip the pages, so the variables stay empty.
    ; Only write the file when page 1 filled them in.
        ${If} $vMode != ""
        FileOpen $9 "$INSTDIR\installer-settings.json" w
        FileWrite $9 '{$\r$\n'
        FileWrite $9 '  "REDIRECT_MODE": "$vMode",$\r$\n'
        ${If} $vMode == "custom"
            FileWrite $9 '  "CUSTOM_INSTANCE": "$vCustomUrl",$\r$\n'
            FileWrite $9 '  "LOADING_STRING": "$vLoading",$\r$\n'
        ${Else}
            FileWrite $9 '  "URL_PREFIX": "$vPrefix",$\r$\n'
            FileWrite $9 '  "TFC_INSTANCE": "$vInstance",$\r$\n'
            FileWrite $9 '  "BASE_URL": "$vBase",$\r$\n'
        ${EndIf}
        ${If} $vGoofs == ${BST_CHECKED}
        ${OrIf} $vGoofs == "true"
            FileWrite $9 '  "GOOFS_ENABLED": true'
        ${Else}
            FileWrite $9 '  "GOOFS_ENABLED": false'
        ${EndIf}
        ${If} $vGameEnabled == ${BST_CHECKED}
            FileWrite $9 ',$\r$\n  "UNIT": "$vUnit",$\r$\n'
            FileWrite $9 '  "LOCATION": "$vLocation",$\r$\n'
            FileWrite $9 '  "CUSTOM_LOCATION": "$vCustomLoc"'
        ${EndIf}
        FileWrite $9 '$\r$\n}$\r$\n'
        FileClose $9
    ${EndIf}
!macroend

!macro customUnInstall
    Delete "$INSTDIR\installer-settings.json"
!macroend
