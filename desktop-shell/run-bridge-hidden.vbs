Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")

' Get the directory where this VBS script is located
strPath = FSO.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = strPath

' Build full paths
strNode = "node"
if FSO.FileExists(strPath & "\node.exe") then
    strNode = """" & strPath & "\node.exe" & """"
end if

strScript = """" & strPath & "\hardware-service.js" & """"

' Debug: If you want to see the command, uncomment the next line
' MsgBox "Running: " & strNode & " " & strScript

On Error Resume Next
WshShell.Run strNode & " " & strScript, 0, False

if Err.Number <> 0 then
    MsgBox "Lucky Boba Error: Could not start the bridge." & vbCrLf & _
           "Path: " & strPath & vbCrLf & _
           "Node: " & strNode & vbCrLf & _
           "Error: " & Err.Description
end if
