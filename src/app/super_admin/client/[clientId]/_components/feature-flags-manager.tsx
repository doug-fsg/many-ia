'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { AVAILABLE_FEATURES, type FeatureName } from '@/config/features'

interface FeatureFlagsManagerProps {
  clientId: string
}

export function FeatureFlagsManager({ clientId }: FeatureFlagsManagerProps) {
  const [flags, setFlags] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [updatingFlags, setUpdatingFlags] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  useEffect(() => {
    fetchFeatureFlags()
  }, [clientId])

  const fetchFeatureFlags = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/super_admin/clients/${clientId}/feature-flags`)
      const data = await response.json()

      if (data.success) {
        setFlags(data.flags || {})
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar Feature Flags',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Erro ao buscar Feature Flags:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar Feature Flags',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleFeature = async (featureName: FeatureName, enabled: boolean) => {
    try {
      setUpdatingFlags((prev) => new Set(prev).add(featureName))

      const response = await fetch(`/api/super_admin/clients/${clientId}/feature-flags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureName, enabled }),
      })

      const data = await response.json()

      if (data.success) {
        setFlags(data.flags || {})
        toast({
          title: 'Sucesso',
          description: `Feature ${enabled ? 'ativada' : 'desativada'} com sucesso`,
        })
      } else {
        toast({
          title: 'Erro',
          description: data.message || 'Não foi possível atualizar Feature Flag',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Erro ao atualizar Feature Flag:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar Feature Flag',
        variant: 'destructive',
      })
    } finally {
      setUpdatingFlags((prev) => {
        const next = new Set(prev)
        next.delete(featureName)
        return next
      })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Carregando Feature Flags...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const featureEntries = Object.entries(AVAILABLE_FEATURES) as [FeatureName, typeof AVAILABLE_FEATURES[FeatureName]][]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Flags</CardTitle>
        <CardDescription>
          Controle quais funcionalidades estão disponíveis para este cliente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {featureEntries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhuma feature disponível</p>
          </div>
        ) : (
          featureEntries.map(([featureName, featureMetadata]) => {
            const isEnabled = flags[featureName] === true
            const isUpdating = updatingFlags.has(featureName)

            return (
              <div
                key={featureName}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Label htmlFor={featureName} className="text-base font-medium cursor-pointer">
                      {featureMetadata.name}
                    </Label>
                    {isEnabled ? (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inativo
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {featureMetadata.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Categoria: {featureMetadata.category}
                  </p>
                </div>
                <div className="ml-4">
                  <Switch
                    id={featureName}
                    checked={isEnabled}
                    onCheckedChange={(checked) => handleToggleFeature(featureName, checked)}
                    disabled={isUpdating}
                  />
                  {isUpdating && (
                    <Loader2 className="h-4 w-4 animate-spin ml-2 inline-block" />
                  )}
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

