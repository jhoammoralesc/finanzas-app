#!/bin/bash

echo "🚀 Iniciando despliegue de FinanzasApp..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Ejecuta desde el directorio raíz del proyecto."
    exit 1
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Construir la aplicación
echo "🔨 Construyendo aplicación para producción..."
npm run build

# Verificar que el build fue exitoso
if [ ! -d "dist" ]; then
    echo "❌ Error: El build falló. No se encontró el directorio dist/"
    exit 1
fi

echo "✅ Build completado exitosamente!"
echo ""
echo "📋 Próximos pasos para desplegar:"
echo "1. Sube el contenido de la carpeta 'dist/' a tu hosting"
echo "2. O usa AWS Amplify Hosting conectando este repositorio"
echo "3. Configura las variables de entorno para WhatsApp"
echo ""
echo "🌐 Para desarrollo local: npm run dev"
echo "📁 Archivos de producción en: ./dist/"

# Mostrar tamaño del build
echo ""
echo "📊 Tamaño del build:"
du -sh dist/
