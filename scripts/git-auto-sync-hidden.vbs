Option Explicit

Dim shell, scriptPath, repositoryPath, command

scriptPath = WScript.Arguments.Named("ScriptPath")
repositoryPath = WScript.Arguments.Named("RepositoryPath")

Set shell = CreateObject("WScript.Shell")
command = "powershell.exe -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File " & _
    Quote(scriptPath) & " -RepositoryPath " & Quote(repositoryPath)

' Window style 0 keeps the complete PowerShell/Git process tree invisible.
' Waiting for completion also ensures no sync terminal is left behind.
shell.Run command, 0, True

Function Quote(value)
    Quote = Chr(34) & Replace(value, Chr(34), Chr(34) & Chr(34)) & Chr(34)
End Function
