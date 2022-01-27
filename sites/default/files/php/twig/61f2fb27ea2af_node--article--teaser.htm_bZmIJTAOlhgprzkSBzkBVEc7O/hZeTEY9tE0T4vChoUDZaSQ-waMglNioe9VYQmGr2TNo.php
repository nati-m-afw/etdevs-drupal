<?php

use Twig\Environment;
use Twig\Error\LoaderError;
use Twig\Error\RuntimeError;
use Twig\Extension\SandboxExtension;
use Twig\Markup;
use Twig\Sandbox\SecurityError;
use Twig\Sandbox\SecurityNotAllowedTagError;
use Twig\Sandbox\SecurityNotAllowedFilterError;
use Twig\Sandbox\SecurityNotAllowedFunctionError;
use Twig\Source;
use Twig\Template;

/* themes/newsplus_lite/templates/node--article--teaser.html.twig */
class __TwigTemplate_56319eda0553dfbfda5bcac20cbae509b5c681de7bb9d6480cc6524081200d90 extends \Twig\Template
{
    private $source;
    private $macros = [];

    public function __construct(Environment $env)
    {
        parent::__construct($env);

        $this->source = $this->getSourceContext();

        $this->blocks = [
            'above_header' => [$this, 'block_above_header'],
            'content' => [$this, 'block_content'],
        ];
        $this->sandbox = $this->env->getExtension('\Twig\Extension\SandboxExtension');
        $this->checkSecurity();
    }

    protected function doGetParent(array $context)
    {
        // line 65
        return "node.html.twig";
    }

    protected function doDisplay(array $context, array $blocks = [])
    {
        $macros = $this->macros;
        $this->parent = $this->loadTemplate("node.html.twig", "themes/newsplus_lite/templates/node--article--teaser.html.twig", 65);
        $this->parent->display($context, array_merge($this->blocks, $blocks));
    }

    // line 66
    public function block_above_header($context, array $blocks = [])
    {
        $macros = $this->macros;
        // line 67
        echo "  ";
        if (($context["has_image"] ?? null)) {
            // line 68
            echo "    <div class=\"teaser-image-wrapper\">
      ";
            // line 69
            echo $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(twig_get_attribute($this->env, $this->source, ($context["content"] ?? null), "field_image", [], "any", false, false, true, 69), 69, $this->source), "html", null, true);
            echo "
    </div>
  ";
        }
    }

    // line 73
    public function block_content($context, array $blocks = [])
    {
        $macros = $this->macros;
        // line 74
        echo "  <div class=\"";
        echo $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, $this->sandbox->ensureToStringAllowed(($context["content_class"] ?? null), 74, $this->source), "html", null, true);
        echo "\">
    ";
        // line 75
        echo $this->extensions['Drupal\Core\Template\TwigExtension']->escapeFilter($this->env, $this->extensions['Drupal\Core\Template\TwigExtension']->withoutFilter($this->sandbox->ensureToStringAllowed(($context["content"] ?? null), 75, $this->source), "field_image", "links"), "html", null, true);
        echo "
  </div>
";
    }

    public function getTemplateName()
    {
        return "themes/newsplus_lite/templates/node--article--teaser.html.twig";
    }

    public function isTraitable()
    {
        return false;
    }

    public function getDebugInfo()
    {
        return array (  76 => 75,  71 => 74,  67 => 73,  59 => 69,  56 => 68,  53 => 67,  49 => 66,  38 => 65,);
    }

    public function getSourceContext()
    {
        return new Source("", "themes/newsplus_lite/templates/node--article--teaser.html.twig", "C:\\xampp\\htdocs\\etdevs-dp\\themes\\newsplus_lite\\templates\\node--article--teaser.html.twig");
    }
    
    public function checkSecurity()
    {
        static $tags = array("if" => 67);
        static $filters = array("escape" => 69, "without" => 75);
        static $functions = array();

        try {
            $this->sandbox->checkSecurity(
                ['if'],
                ['escape', 'without'],
                []
            );
        } catch (SecurityError $e) {
            $e->setSourceContext($this->source);

            if ($e instanceof SecurityNotAllowedTagError && isset($tags[$e->getTagName()])) {
                $e->setTemplateLine($tags[$e->getTagName()]);
            } elseif ($e instanceof SecurityNotAllowedFilterError && isset($filters[$e->getFilterName()])) {
                $e->setTemplateLine($filters[$e->getFilterName()]);
            } elseif ($e instanceof SecurityNotAllowedFunctionError && isset($functions[$e->getFunctionName()])) {
                $e->setTemplateLine($functions[$e->getFunctionName()]);
            }

            throw $e;
        }

    }
}
