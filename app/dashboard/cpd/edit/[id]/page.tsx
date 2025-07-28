"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import CPDForm from "../../CPDForm";
import { CPDData } from "../../CPDForm";

export default function EditCPDPage() {
  const router = useRouter();
  const params = useParams();
  const cpdId = params.id as string;
  const [cpdData, setCpdData] = useState<CPDData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCPD = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/login");
          return;
        }

        // @ts-ignore: Supabase type workaround for .eq
        const { data, error } = await ((supabase as any)
          .from("cpd")
          .select("*")
          .eq("id", cpdId)
          .eq("user_id", user.id)
          .single());

        if (error) {
          console.error('Error fetching CPD:', error);
          setError('Failed to load CPD activity');
          return;
        }

        if (data) {
          // Transform the data to match CPDData type
          const transformedData: CPDData = {
            title: data.title || '',
            activityDate: data.activity_date || '',
            hours: data.hours || 0,
            cpdType: data.cpd_type || '',
            learningMethod: data.learning_method || '',
            providerOrganization: data.provider_organization || '',
            description: data.description || '',
            keyLearnings: data.key_learnings || '',
            applicationToPractice: data.application_to_practice || '',
            icfCompetencies: Array.isArray(data.icf_competencies) ? data.icf_competencies : [],
            documentType: data.document_type || '',
            supportingDocument: data.supporting_document || data.certificate_proof || '',
          };
          setCpdData(transformedData);
        }
      } catch (error) {
        console.error('Error:', error);
        setError('Failed to load CPD activity');
      } finally {
        setLoading(false);
      }
    };

    if (cpdId) {
      fetchCPD();
    }
  }, [cpdId, router]);

  const handleUpdateCPD = async (updatedData: CPDData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      let documentUrl = "";
      
      // Handle file upload if supporting document is provided and it's a new file
      if (updatedData.supportingDocument && updatedData.supportingDocument !== "") {
        const file = updatedData.supportingDocument as any;
        if (file instanceof File) {
          try {
            // Sanitize filename to avoid path issues
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const fileName = `${user.id}/${Date.now()}_${sanitizedName}`;
            console.log('Attempting to upload file:', fileName);
            console.log('File size:', file.size, 'bytes');
            console.log('File type:', file.type);
            
            // Check file size (limit to 10MB)
            if (file.size > 10 * 1024 * 1024) {
              console.error('File too large. Maximum size is 10MB.');
              setError('File too large. Maximum size is 10MB.');
              return;
            }
            
            // First check if bucket exists and we have access
            const { data: bucketData, error: bucketError } = await supabase.storage
              .from('certificates')
              .list('', { limit: 1 });
            
            if (bucketError) {
              console.error('Bucket access error:', bucketError);
              setError(`Storage bucket error: ${bucketError.message}`);
              return;
            } else {
              console.log('Bucket access successful, proceeding with upload...');
              
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('certificates')
                .upload(fileName, file, {
                  cacheControl: '3600',
                  upsert: false
                });
              
              if (uploadError) {
                console.error('Upload error details:', uploadError);
                console.error('Error message:', uploadError.message);
                setError(`Upload failed: ${uploadError.message}`);
                return;
              } else if (uploadData) {
                console.log('Upload successful, getting public URL...');
                const { data: urlData } = supabase.storage
                  .from('certificates')
                  .getPublicUrl(fileName);
                documentUrl = urlData.publicUrl;
                console.log('File uploaded successfully:', documentUrl);
              }
            }
          } catch (error) {
            console.error('File upload failed with exception:', error);
            setError(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return;
          }
        } else if (typeof file === 'string') {
          // If it's already a URL string, use it as is
          documentUrl = file;
        }
      }

      const { error } = await supabase
        .from("cpd")
        .update({
          title: updatedData.title,
          activity_date: updatedData.activityDate,
          hours: updatedData.hours,
          cpd_type: updatedData.cpdType,
          learning_method: updatedData.learningMethod,
          provider_organization: updatedData.providerOrganization,
          description: updatedData.description,
          key_learnings: updatedData.keyLearnings,
          application_to_practice: updatedData.applicationToPractice,
          icf_competencies: updatedData.icfCompetencies,
          document_type: updatedData.documentType,
          supporting_document: documentUrl,
          certificate_proof: documentUrl, // Keep for backward compatibility
          updated_at: new Date().toISOString(),
        })
        .eq("id", cpdId)
        .eq("user_id", user.id);

      if (error) {
        console.error('Error updating CPD:', error);
        setError('Failed to update CPD activity');
        return;
      }

      // Redirect back to CPD log
      router.push("/dashboard/cpd/log");
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to update CPD activity');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading CPD activity...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/dashboard/cpd/log")}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            Back to CPD Log
          </button>
        </div>
      </div>
    );
  }

  if (!cpdData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-xl mb-4">CPD activity not found</div>
          <button
            onClick={() => router.push("/dashboard/cpd/log")}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            Back to CPD Log
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard/cpd/log")}
            className="text-purple-600 hover:text-purple-800 mb-4 flex items-center gap-2"
          >
            ← Back to CPD Log
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit CPD Activity</h1>
        </div>
        
        <CPDForm 
          onSubmit={handleUpdateCPD}
          initialData={cpdData}
          isEditing={true}
        />
      </div>
    </div>
  );
} 