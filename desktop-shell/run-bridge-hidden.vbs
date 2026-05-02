Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")
' Get the directory where this VBS script is located
strPath = FSO.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = strPath
' Run node hidden (0 = hidden, False = don't wait for exit)
WshShell.Run "node hardware-service.js", 0, False
